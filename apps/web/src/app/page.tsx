import { redirect } from "next/navigation";
import Link from "next/link";
import { getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/components/Logo";
import { Button, Card } from "@/components/ui";

export default async function HomePage() {
  const me = await getMe();

  // Signed in but hasn't claimed a handle yet → finish onboarding.
  if (me && !me.handle) redirect("/onboarding");

  if (!me) {
    return (
      <div className="min-h-full">
        <SiteHeader me={null} />
        <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-prayer to-[#f0a58f] px-8 py-14 text-white shadow-sm">
            <p className="text-sm font-semibold tracking-wide uppercase opacity-90">Prayer Social</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              The one and only 100% free prayer app
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base opacity-95">
              Share prayer requests, intercede for others across the world, and testify when prayers
              are answered — connecting Christians worldwide.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/sign-up">
                <Button className="bg-white text-prayer hover:bg-white/90">Get started</Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-white hover:bg-white/15">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <AppShell me={me} pillar="prayer">
      <Card className="p-8">
        <div className="flex items-center gap-2 text-prayer">
          <Logo withWordmark={false} />
          <h1 className="text-2xl font-bold">Prayer Social</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Welcome, {me.displayName}. The prayer wall — public requests, “I prayed” intercession,
          comments and answered-prayer testimonials — arrives in Phase 2. Your account, profile, and
          social graph are live now.
        </p>
        <div className="mt-5 flex gap-3">
          <Link href={`/${me.handle}`}>
            <Button>View your profile</Button>
          </Link>
          <Link href="/settings/profile">
            <Button variant="outline">Edit profile</Button>
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
