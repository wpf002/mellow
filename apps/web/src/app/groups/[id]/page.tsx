import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGroup, getGroupPrayers, getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PrayerSubnav } from "@/components/PrayerSubnav";
import { JoinGroupButton } from "@/components/JoinGroupButton";
import { GroupPrayerComposer } from "@/components/GroupPrayerComposer";
import { PrayerCard } from "@/components/PrayerCard";
import { Card } from "@/components/ui";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  const group = await getGroup(id);
  if (!group) notFound();

  const isMember = group.viewerRole !== null;
  const { items: prayers } = isMember ? await getGroupPrayers(id) : { items: [] };

  return (
    <AppShell me={me} pillar="prayer">
      <PrayerSubnav active="groups" />
      <Link href="/groups" className="text-sm text-muted hover:underline">
        ← All Groups
      </Link>

      <Card className="mt-2 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {group.memberCount} member{group.memberCount === 1 ? "" : "s"} · led by{" "}
              {group.owner.displayName}
            </p>
            {group.description && <p className="mt-3 text-sm text-ink/90">{group.description}</p>}
          </div>
          <JoinGroupButton
            groupId={group.id}
            initialIsMember={isMember}
            isOwner={group.viewerRole === "OWNER"}
          />
        </div>
      </Card>

      {isMember ? (
        <div className="mt-4 space-y-4">
          <GroupPrayerComposer groupId={group.id} />
          {prayers.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted">
              No prayers in this group yet. Share the first one above.
            </Card>
          ) : (
            prayers.map((prayer) => <PrayerCard key={prayer.id} prayer={prayer} canPray />)
          )}
        </div>
      ) : (
        <Card className="mt-4 p-8 text-center">
          <p className="text-sm text-muted">Join this group to see and share its prayers.</p>
        </Card>
      )}
    </AppShell>
  );
}
