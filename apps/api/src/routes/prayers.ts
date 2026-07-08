import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma, prisma } from "@mellow/db";
import {
  answerPrayerSchema,
  createCommentSchema,
  createPrayerSchema,
  cursorQuerySchema,
  handleSchema,
} from "@mellow/shared";
import { getUserId, requireUserId } from "../lib/session.js";
import { serializePrayer, serializePrayers } from "../lib/serializePrayer.js";

const idParams = z.object({ id: z.string().min(1) });
const listQuery = cursorQuerySchema.extend({ author: handleSchema.optional() });

const prayerInclude = { author: true, testimonial: true, group: true } as const;

/**
 * Where clause that enforces prayer visibility in the query layer (never the
 * UI). A viewer sees: their own prayers (any visibility), all PUBLIC prayers,
 * and FRIENDS prayers whose author mutually follows them. PRIVATE and GROUP
 * (Phase 3) prayers are visible only to their author.
 */
function visibilityWhere(viewerId: string | null): Prisma.PrayerWhereInput {
  if (!viewerId) return { visibility: "PUBLIC" };
  return {
    OR: [
      { authorId: viewerId },
      { visibility: "PUBLIC" },
      {
        visibility: "FRIENDS",
        author: {
          followers: { some: { followerId: viewerId } }, // viewer follows author
          following: { some: { followingId: viewerId } }, // author follows viewer
        },
      },
      // GROUP prayers are visible to members of the group.
      { visibility: "GROUP", group: { members: { some: { userId: viewerId } } } },
    ],
  };
}

/** Load a single prayer the viewer is allowed to see, or null. */
async function findVisiblePrayer(id: string, viewerId: string | null) {
  return prisma.prayer.findFirst({
    where: { AND: [{ id }, visibilityWhere(viewerId)] },
    include: prayerInclude,
  });
}

export async function registerPrayerRoutes(app: FastifyInstance) {
  // Compose a new prayer.
  app.post("/prayers", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = createPrayerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { title, body, visibility } = parsed.data;

    const prayer = await prisma.prayer.create({
      data: {
        authorId: userId,
        title: title && title.length > 0 ? title : null,
        body,
        visibility,
      },
      include: prayerInclude,
    });
    return reply.code(201).send(await serializePrayer(prayer, userId));
  });

  // Prayer wall (viewer-aware, cursor-paginated). `?author=handle` scopes to one
  // user's prayers (profile tab).
  app.get("/prayers", async (request, reply) => {
    const parsed = listQuery.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    const { cursor, limit, author } = parsed.data;

    const viewerId = await getUserId(request);

    // The global wall and profile tab show standalone prayers; group prayers
    // live in their group feed (GET /groups/:id/prayers).
    const where: Prisma.PrayerWhereInput = { AND: [visibilityWhere(viewerId), { groupId: null }] };
    if (author) {
      const target = await prisma.user.findUnique({ where: { handle: author } });
      if (!target) return { items: [], nextCursor: null };
      (where.AND as Prisma.PrayerWhereInput[]).push({ authorId: target.id });
    }

    const rows = await prisma.prayer.findMany({
      where,
      include: prayerInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: await serializePrayers(page, viewerId),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  });

  // Prayer detail (viewer-aware, visibility-gated).
  app.get("/prayers/:id", async (request, reply) => {
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const viewerId = await getUserId(request);
    const prayer = await findVisiblePrayer(parsed.data.id, viewerId);
    if (!prayer) return reply.code(404).send({ error: "Prayer not found" });

    return serializePrayer(prayer, viewerId);
  });

  // Comments on a prayer (chronological, cursor-paginated).
  app.get("/prayers/:id/comments", async (request, reply) => {
    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedQuery = cursorQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) return reply.code(400).send({ error: "Invalid query" });
    const { cursor, limit } = parsedQuery.data;

    const viewerId = await getUserId(request);
    const prayer = await findVisiblePrayer(parsedParams.data.id, viewerId);
    if (!prayer) return reply.code(404).send({ error: "Prayer not found" });

    const rows = await prisma.comment.findMany({
      where: { prayerId: prayer.id },
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

  // "I prayed" — append an intercession event (append-only) and return the
  // prayer with refreshed derived counts.
  app.post("/prayers/:id/pray", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const prayer = await findVisiblePrayer(parsed.data.id, userId);
    if (!prayer) return reply.code(404).send({ error: "Prayer not found" });

    await prisma.prayerLog.create({ data: { prayerId: prayer.id, userId } });

    const refreshed = await prisma.prayer.findUnique({
      where: { id: prayer.id },
      include: prayerInclude,
    });
    return serializePrayer(refreshed!, userId);
  });

  // Add a comment.
  app.post("/prayers/:id/comments", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedBody = createCommentSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsedBody.error.flatten() });
    }

    const prayer = await findVisiblePrayer(parsedParams.data.id, userId);
    if (!prayer) return reply.code(404).send({ error: "Prayer not found" });

    const comment = await prisma.comment.create({
      data: { prayerId: prayer.id, authorId: userId, body: parsedBody.data.body },
      include: { author: true },
    });
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

  // Author marks the prayer answered, attaching a testimonial.
  app.post("/prayers/:id/answer", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedBody = answerPrayerSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsedBody.error.flatten() });
    }

    const existing = await prisma.prayer.findUnique({ where: { id: parsedParams.data.id } });
    if (!existing) return reply.code(404).send({ error: "Prayer not found" });
    if (existing.authorId !== userId) {
      return reply.code(403).send({ error: "Only the author can mark this answered" });
    }
    if (existing.status === "ANSWERED") {
      return reply.code(409).send({ error: "Prayer is already answered" });
    }

    const prayer = await prisma.$transaction(async (tx) => {
      await tx.testimonial.create({
        data: { prayerId: existing.id, authorId: userId, body: parsedBody.data.body },
      });
      return tx.prayer.update({
        where: { id: existing.id },
        data: { status: "ANSWERED", answeredAt: new Date() },
        include: prayerInclude,
      });
    });

    return serializePrayer(prayer, userId);
  });
}
