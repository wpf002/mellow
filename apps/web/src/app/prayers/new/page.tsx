import { redirect } from "next/navigation";
import Link from "next/link";
import { getCompanionEnabled, getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PrayerComposer } from "@/components/PrayerComposer";

export default async function NewPrayerPage() {
  const [me, companionEnabled] = await Promise.all([getMe(), getCompanionEnabled()]);
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  return (
    <AppShell me={me} pillar="prayer">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-muted hover:underline">
          ← Back to the wall
        </Link>
        <h1 className="mt-2 mb-4 text-2xl font-bold">Share a prayer request</h1>
        <PrayerComposer companionEnabled={companionEnabled} />
      </div>
    </AppShell>
  );
}
