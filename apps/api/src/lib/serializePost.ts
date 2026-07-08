import { prisma, type Post as PostRow, type ReactionType, type User } from "@mellow/db";
import type { Post } from "@mellow/shared";

type PostWithAuthor = PostRow & { author: User };

const REACTION_TYPES: ReactionType[] = ["AMEN", "PRAISE", "PRAYING", "LOVE"];

/**
 * Serialize posts into their public view, computing the reaction rollup, comment
 * count, and the viewer's own reaction in batch (no N+1). All derived.
 */
export async function serializePosts(
  posts: PostWithAuthor[],
  viewerId: string | null,
): Promise<Post[]> {
  const ids = posts.map((p) => p.id);
  if (ids.length === 0) return [];

  const [reactionGroups, commentGroups, viewerReactions] = await Promise.all([
    prisma.postReaction.groupBy({
      by: ["postId", "type"],
      where: { postId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.postComment.groupBy({
      by: ["postId"],
      where: { postId: { in: ids } },
      _count: { _all: true },
    }),
    viewerId
      ? prisma.postReaction.findMany({
          where: { postId: { in: ids }, userId: viewerId },
          select: { postId: true, type: true },
        })
      : Promise.resolve([] as { postId: string; type: ReactionType }[]),
  ]);

  const countsByPost = new Map<string, Record<ReactionType, number>>();
  for (const id of ids) countsByPost.set(id, { AMEN: 0, PRAISE: 0, PRAYING: 0, LOVE: 0 });
  for (const g of reactionGroups) countsByPost.get(g.postId)![g.type] = g._count._all;

  const commentByPost = new Map(commentGroups.map((c) => [c.postId, c._count._all]));
  const viewerReactionByPost = new Map(viewerReactions.map((r) => [r.postId, r.type]));

  return posts.map((p) => {
    const counts = countsByPost.get(p.id)!;
    const total = REACTION_TYPES.reduce((sum, t) => sum + counts[t], 0);
    return {
      id: p.id,
      body: p.body,
      visibility: p.visibility,
      createdAt: p.createdAt.toISOString(),
      author: {
        id: p.author.id,
        handle: p.author.handle,
        displayName: p.author.displayName ?? p.author.name,
        avatarUrl: p.author.avatarUrl ?? p.author.image,
      },
      isAuthor: viewerId === p.authorId,
      reactions: { total, counts, viewerReaction: viewerReactionByPost.get(p.id) ?? null },
      commentCount: commentByPost.get(p.id) ?? 0,
    };
  });
}

export async function serializePost(post: PostWithAuthor, viewerId: string | null): Promise<Post> {
  const [one] = await serializePosts([post], viewerId);
  return one!;
}
