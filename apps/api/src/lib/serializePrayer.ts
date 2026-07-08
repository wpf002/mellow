import {
  prisma,
  type Prayer as PrayerRow,
  type PrayerGroup,
  type Testimonial as TestimonialRow,
  type User,
} from "@mellow/db";
import type { Prayer, PrayerAuthor } from "@mellow/shared";

type PrayerWithRelations = PrayerRow & {
  author: User;
  testimonial: TestimonialRow | null;
  group: PrayerGroup | null;
};

function toAuthor(user: User): PrayerAuthor {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName ?? user.name,
    avatarUrl: user.avatarUrl ?? user.image,
  };
}

/**
 * Serialize prayers into their public view, computing the derived counts
 * (uniquePrayed / totalPrayed / commentCount) and viewer-relative flags in
 * batch to avoid N+1 queries on the wall. Counts are never stored.
 */
export async function serializePrayers(
  prayers: PrayerWithRelations[],
  viewerId: string | null,
): Promise<Prayer[]> {
  const ids = prayers.map((p) => p.id);
  if (ids.length === 0) return [];

  const [totals, uniquePairs, comments, viewerPrayed] = await Promise.all([
    prisma.prayerLog.groupBy({
      by: ["prayerId"],
      where: { prayerId: { in: ids } },
      _count: { _all: true },
    }),
    // One row per (prayer, user) pair → tally per prayer gives uniquePrayed.
    prisma.prayerLog.findMany({
      where: { prayerId: { in: ids } },
      distinct: ["prayerId", "userId"],
      select: { prayerId: true },
    }),
    prisma.comment.groupBy({
      by: ["prayerId"],
      where: { prayerId: { in: ids } },
      _count: { _all: true },
    }),
    viewerId
      ? prisma.prayerLog.findMany({
          where: { prayerId: { in: ids }, userId: viewerId },
          distinct: ["prayerId"],
          select: { prayerId: true },
        })
      : Promise.resolve([] as { prayerId: string }[]),
  ]);

  const totalByPrayer = new Map(totals.map((t) => [t.prayerId, t._count._all]));
  const commentByPrayer = new Map(comments.map((c) => [c.prayerId, c._count._all]));
  const uniqueByPrayer = new Map<string, number>();
  for (const row of uniquePairs) {
    uniqueByPrayer.set(row.prayerId, (uniqueByPrayer.get(row.prayerId) ?? 0) + 1);
  }
  const viewerPrayedSet = new Set(viewerPrayed.map((r) => r.prayerId));

  return prayers.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    imageUrl: p.imageUrl,
    visibility: p.visibility,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    answeredAt: p.answeredAt ? p.answeredAt.toISOString() : null,
    author: toAuthor(p.author),
    group: p.group ? { id: p.group.id, name: p.group.name } : null,
    uniquePrayed: uniqueByPrayer.get(p.id) ?? 0,
    totalPrayed: totalByPrayer.get(p.id) ?? 0,
    commentCount: commentByPrayer.get(p.id) ?? 0,
    viewerHasPrayed: viewerPrayedSet.has(p.id),
    isAuthor: viewerId === p.authorId,
    testimonial: p.testimonial
      ? {
          id: p.testimonial.id,
          body: p.testimonial.body,
          createdAt: p.testimonial.createdAt.toISOString(),
        }
      : null,
  }));
}

/** Convenience for single-prayer endpoints. */
export async function serializePrayer(
  prayer: PrayerWithRelations,
  viewerId: string | null,
): Promise<Prayer> {
  const [serialized] = await serializePrayers([prayer], viewerId);
  return serialized!;
}
