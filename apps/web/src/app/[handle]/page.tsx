import Link from "next/link";
import { notFound } from "next/navigation";
import { getMe, getPrayers, getProfile } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Button, Card } from "@/components/ui";
import { FollowButton } from "@/components/FollowButton";
import { PrayerCard } from "@/components/PrayerCard";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [me, profile] = await Promise.all([getMe(), getProfile(handle)]);
  if (!profile) notFound();

  const { items: prayers } = await getPrayers({ author: handle, limit: 30 });
  const name = profile.displayName ?? `@${profile.handle}`;

  return (
    <AppShell me={me} pillar="prayer">
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-prayer to-[#f0a58f]" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar name={name} src={profile.avatarUrl} size={80} className="ring-4 ring-surface" />
            <div className="mb-1">
              {profile.isViewer ? (
                <Link href="/settings/profile">
                  <Button variant="outline">Edit profile</Button>
                </Link>
              ) : me ? (
                <FollowButton handle={profile.handle!} initialFollowing={profile.isFollowedByViewer} />
              ) : (
                <Link href="/sign-in">
                  <Button>Follow</Button>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="text-xl font-bold">{name}</h1>
            <p className="text-sm text-muted">@{profile.handle}</p>
            {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}
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
