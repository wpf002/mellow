import { prisma, type User } from "@mellow/db";
import type { PublicUser } from "@mellow/shared";

/**
 * Serialize a user row into the public profile view, computing the derived
 * follow counts and the viewer-relative flags. Counts are never stored.
 */
export async function serializeUser(user: User, viewerId: string | null): Promise<PublicUser> {
  const [followerCount, followingCount, followEdge] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    viewerId && viewerId !== user.id
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
        })
      : Promise.resolve(null),
  ]);

  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName ?? user.name,
    avatarUrl: user.avatarUrl ?? user.image,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    followerCount,
    followingCount,
    isFollowedByViewer: Boolean(followEdge),
    isViewer: viewerId === user.id,
  };
}
