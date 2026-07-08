/**
 * Agape Algorithm v0 — the feed ranker.
 *
 * A PURE, SWAPPABLE function: given a chronological window of candidate posts
 * and the viewer's follow graph, it returns the display order. v0 is
 * "chronological + follow-graph affinity" — posts by followed authors (and the
 * viewer's own) get a recency bonus so they surface above equally-recent posts
 * from strangers. Phase 6 replaces this with an AI re-rank behind the same
 * signature, with this as the fallback.
 *
 * Pagination stays chronological (the caller derives the cursor from createdAt);
 * this only reorders within the fetched window.
 */

export interface FeedRankContext {
  followingIds: Set<string>;
  /** "Now" as ms — passed in so the function stays pure/testable. */
  nowMs: number;
}

// A followed author's post is treated as if it were this much more recent.
const AFFINITY_BONUS_MS = 12 * 60 * 60 * 1000; // 12 hours

export function rankFeed<T extends { authorId: string; createdAt: Date }>(
  posts: T[],
  ctx: FeedRankContext,
): T[] {
  const score = (p: T): number => {
    const base = p.createdAt.getTime();
    const affinity = ctx.followingIds.has(p.authorId) ? AFFINITY_BONUS_MS : 0;
    return base + affinity;
  };
  // Stable sort by descending score; ties keep chronological input order.
  return [...posts].sort((a, b) => score(b) - score(a));
}
