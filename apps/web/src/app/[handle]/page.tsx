import Link from "next/link";
import { notFound } from "next/navigation";
import { getAchievements, getMe, getPrayers, getProfile, getReputation } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Button, Card } from "@/components/ui";
import { FollowButton } from "@/components/FollowButton";
import { MessageButton } from "@/components/MessageButton";
import { PrayerCard } from "@/components/PrayerCard";
import { ReputationCard } from "@/components/ReputationCard";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [me, profile] = await Promise.all([getMe(), getProfile(handle)]);
  if (!profile) notFound();

  const [{ items: prayers }, reputation, { items: achievements }] = await Promise.all([
    getPrayers({ author: handle, limit: 30 }),
    getReputation(handle),
    getAchievements(handle),
  ]);
  const name = profile.displayName ?? `@${profile.handle}`;

  return (
    <AppShell me={me} pillar="prayer">
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-prayer to-[#f0a58f]" />
        <div className="px-6 pb-6">
          {/* Avatar overlaps the banner; actions sit below it, on the name row. */}
          <div className="-mt-10">
            <Avatar name={name} src={profile.avatarUrl} size={80} className="ring-4 ring-surface" />
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold">{name}</h1>
              <p className="text-sm text-muted">@{profile.handle}</p>
              {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}
            </div>
            <div className="shrink-0">
              {profile.isViewer ? (
                <Link href="/settings/profile">
                  <Button variant="outline">Edit</Button>
                </Link>
              ) : me ? (
                <div className="flex gap-2">
                  <MessageButton handle={profile.handle!} />
                  <FollowButton handle={profile.handle!} initialFollowing={profile.isFollowedByViewer} />
                </div>
              ) : (
                <Link href="/sign-in">
                  <Button>Follow</Button>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-5 text-sm">
            <span>
              <strong>{profile.followingCount}</strong> <span className="text-muted">Following</span>
            </span>
            <span>
              <strong>{profile.followerCount}</strong> <span className="text-muted">Followers</span>
            </span>
          </div>
        </div>
      </Card>

      {reputation && (
        <div className="mt-4">
          <ReputationCard reputation={reputation} achievements={achievements} />
        </div>
      )}

      <div className="mt-4">
        <h2 className="mb-3 px-1 text-sm font-semibold text-muted">Prayers</h2>
        {prayers.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted">
              {profile.isViewer ? "You haven’t" : `${name} hasn’t`} shared any prayer requests yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {prayers.map((prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} canPray={Boolean(me)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
