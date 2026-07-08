import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma, prisma } from "@mellow/db";
import {
  createPostCommentSchema,
  createPostSchema,
  cursorQuerySchema,
  reactSchema,
} from "@mellow/shared";
import { aiEnabled, rankFeedAI } from "@mellow/ai";
import { getUserId, requireUserId } from "../lib/session.js";
import { serializePost, serializePosts } from "../lib/serializePost.js";
import { rankFeed } from "../lib/feedRanker.js";
import { emitReputation } from "../lib/reputation.js";
import { notify } from "../lib/notifications.js";

const idParams = z.object({ id: z.string().min(1) });

/** Same visibility semantics as prayers, on the Post relation graph. */
function postVisibilityWhere(viewerId: string | null): Prisma.PostWhereInput {
  if (!viewerId) return { visibility: "PUBLIC" };
  return {
    OR: [
      { authorId: viewerId },
      { visibility: "PUBLIC" },
      {
        visibility: "FRIENDS",
        author: {
          followers: { some: { followerId: viewerId } },
          following: { some: { followingId: viewerId } },
        },
      },
    ],
  };
}

async function findVisiblePost(id: string, viewerId: string | null) {
  return prisma.post.findFirst({
    where: { AND: [{ id }, postVisibilityWhere(viewerId)] },
    include: { author: true },
  });
}

export async function registerPostRoutes(app: FastifyInstance) {
  // Compose a fellowship post.
  app.post("/posts", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = createPostSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const post = await prisma.post.create({
      data: {
        authorId: userId,
        body: parsed.data.body,
        imageUrl: parsed.data.imageUrl && parsed.data.imageUrl.length > 0 ? parsed.data.imageUrl : null,
        visibility: parsed.data.visibility,
      },
      include: { author: true },
    });
    await emitReputation(userId, "FELLOWSHIP", post.id);
    return reply.code(201).send(await serializePost(post, userId));
  });

  // The feed — Agape Algorithm. The candidate window is chronological and
  // cursor-paginated; display order comes from the AI re-rank (v1) when the AI
  // layer is enabled, always falling back to the pure follow-graph ranker (v0)
  // when disabled or on any AI failure.
  app.get("/feed", async (request, reply) => {
    const parsed = cursorQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    const { cursor, limit } = parsed.data;

    const viewerId = await getUserId(request);
    const rows = await prisma.post.findMany({
      where: postVisibilityWhere(viewerId),
      include: { author: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    // Cursor stays on the chronological order; ranking only reorders the page.
    const nextCursor = hasMore ? page[page.length - 1]!.id : null;

    let followingIds = new Set<string>();
    if (viewerId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      });
      followingIds = new Set(follows.map((f) => f.followingId));
    }

    // v0 (pure, always computed) is both the fallback and the AI's baseline.
    const ranked = rankFeed(page, { followingIds, nowMs: Date.now() });
    let items = await serializePosts(ranked, viewerId);

    // Only pay for the AI re-rank when there's enough to order (ranking a
    // handful of posts via an LLM isn't worth the latency), and bound its tail
    // with a timeout — either way v0 is the fallback.
    const AI_RERANK_MIN_POSTS = 5;
    const AI_RERANK_TIMEOUT_MS = 2500;
    if (aiEnabled() && items.length >= AI_RERANK_MIN_POSTS) {
      try {
        const orderedIds = await Promise.race([
          rankFeedAI(
            items.map((p) => ({
              id: p.id,
              authorHandle: p.author.handle,
              followed: followingIds.has(p.author.id),
              body: p.body,
              createdAt: p.createdAt,
              reactions: p.reactions.total,
              comments: p.commentCount,
            })),
          ),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("AI re-rank timed out")), AI_RERANK_TIMEOUT_MS),
          ),
        ]);
        const byId = new Map(items.map((p) => [p.id, p]));
        items = orderedIds.map((id) => byId.get(id)!);
      } catch (e) {
        request.log.warn({ err: e }, "AI feed re-rank skipped; serving v0 order");
      }
    }

    return { items, nextCursor };
  });

  // Post detail.
  app.get("/posts/:id", async (request, reply) => {
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });
    const viewerId = await getUserId(request);
    const post = await findVisiblePost(parsed.data.id, viewerId);
    if (!post) return reply.code(404).send({ error: "Post not found" });
    return serializePost(post, viewerId);
  });

  // React (set or change the viewer's reaction).
  app.post("/posts/:id/react", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedBody = reactSchema.safeParse(request.body);
    if (!parsedBody.success) return reply.code(400).send({ error: "Invalid reaction" });

    const post = await findVisiblePost(parsedParams.data.id, userId);
    if (!post) return reply.code(404).send({ error: "Post not found" });

    await prisma.postReaction.upsert({
      where: { postId_userId: { postId: post.id, userId } },
      create: { postId: post.id, userId, type: parsedBody.data.type },
      update: { type: parsedBody.data.type },
    });
    await notify(post.authorId, userId, "POST_REACTION", post.id);
    return serializePost(post, userId);
  });

  // Remove the viewer's reaction.
  app.delete("/posts/:id/react", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const post = await findVisiblePost(parsed.data.id, userId);
    if (!post) return reply.code(404).send({ error: "Post not found" });

    await prisma.postReaction.deleteMany({ where: { postId: post.id, userId } });
    return serializePost(post, userId);
  });

  // Add a comment.
  app.post("/posts/:id/comments", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedBody = createPostCommentSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsedBody.error.flatten() });
    }

    const post = await findVisiblePost(parsedParams.data.id, userId);
    if (!post) return reply.code(404).send({ error: "Post not found" });

    const comment = await prisma.postComment.create({
      data: { postId: post.id, authorId: userId, body: parsedBody.data.body },
      include: { author: true },
    });
    await emitReputation(userId, "ENCOURAGEMENT", comment.id);
    await notify(post.authorId, userId, "POST_COMMENT", post.id);
    return reply.code(201).send({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        handle: comment.author.handle,
        displayName: comment.author.displayName ?? comment.author.name,
        avatarUrl: comment.author.avatarUrl ?? comment.author.image,
      },
    });
  });

  // List comments (chronological, cursor-paginated).
  app.get("/posts/:id/comments", async (request, reply) => {
    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedQuery = cursorQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) return reply.code(400).send({ error: "Invalid query" });
    const { cursor, limit } = parsedQuery.data;

    const viewerId = await getUserId(request);
    const post = await findVisiblePost(parsedParams.data.id, viewerId);
    if (!post) return reply.code(404).send({ error: "Post not found" });

    const rows = await prisma.postComment.findMany({
      where: { postId: post.id },
      include: { author: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: page.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.author.id,
          handle: c.author.handle,
          displayName: c.author.displayName ?? c.author.name,
          avatarUrl: c.author.avatarUrl ?? c.author.image,
        },
      })),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  });
}
