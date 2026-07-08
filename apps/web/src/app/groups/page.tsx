import { redirect } from "next/navigation";
import { getGroups, getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PrayerSubnav } from "@/components/PrayerSubnav";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { GroupCard } from "@/components/GroupCard";
import { Card } from "@/components/ui";

export default async function GroupsPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  const { items: groups } = await getGroups();

  return (
    <AppShell me={me} pillar="prayer">
      <PrayerSubnav active="groups" />
      <CreateGroupForm />

      {groups.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-semibold">No groups yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Prayer groups let a circle pray together. Create the first one.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
