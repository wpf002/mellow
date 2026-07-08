import { redirect } from "next/navigation";
import Link from "next/link";
import { getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { CallingSubnav } from "@/components/CallingSubnav";
import { JobComposer } from "@/components/JobComposer";

export default async function NewJobPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  return (
    <AppShell me={me} pillar="calling">
      <CallingSubnav active="openings" />
      <div className="mx-auto max-w-2xl">
        <Link href="/calling" className="text-sm text-muted hover:underline">
          ← All openings
        </Link>
        <h1 className="mt-2 mb-4 text-2xl font-bold">Post an opening</h1>
        <JobComposer />
      </div>
    </AppShell>
  );
}
