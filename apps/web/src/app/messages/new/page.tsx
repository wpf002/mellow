import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { NewGroupForm } from "@/components/NewGroupForm";

export default async function NewGroupPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  return (
    <AppShell me={me} pillar="fellowship" section="messages">
      <div className="mx-auto max-w-2xl">
        <Link href="/messages" className="text-sm text-muted hover:underline">
          ← All Messages
        </Link>
        <h1 className="mt-2 mb-4 text-xl font-bold">New Group</h1>
        <NewGroupForm />
      </div>
    </AppShell>
  );
}
