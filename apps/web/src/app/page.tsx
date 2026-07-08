import { redirect } from "next/navigation";
import Link from "next/link";
import { getMe, getPrayers } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { SiteHeader } from "@/components/SiteHeader";
import { Avatar } from "@/components/Avatar";
import { PrayerCard } from "@/components/PrayerCard";
import { PrayerSubnav } from "@/components/PrayerSubnav";
import { Button, Card } from "@/components/ui";

export default async function HomePage() {
  const me = await getMe();

  // Signed in but hasn't claimed a handle yet → finish onboarding.
  if (me && !me.handle) redirect("/onboarding");

  if (!me) {
    return (
      <div className="min-h-full">
        <SiteHeader me={null} showAuthActions={false} />
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
                {/* Inline color so the coral text reliably wins over the base `text-white`. */}
                <Button className="bg-white hover:bg-white/90" style={{ color: "var(--color-prayer)" }}>
                  Get Started
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-white hover:bg-white/15">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const { items: prayers } = await getPrayers({ limit: 30 });

  return (
    <AppShell me={me} pillar="prayer">
      <PrayerSubnav active="wall" />
      {/* Compose prompt */}
      <Card className="mb-4 flex items-center gap-3 p-4">
        <Avatar name={me.displayName ?? me.handle ?? "You"} src={me.avatarUrl} size={40} />
        <Link href="/prayers/new" className="flex-1">
          <div className="rounded-full border border-line bg-white px-4 py-2.5 text-sm text-muted hover:border-brand">
            Share a prayer request…
          </div>
        </Link>
        <Link href="/prayers/new">
          <Button>Post</Button>
        </Link>
      </Card>

      {prayers.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-semibold">The wall is quiet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Be the first to share a prayer request. When you post, it appears here for the community
            to pray over.
          </p>
          <div className="mt-5">
            <Link href="/prayers/new">
              <Button>Share the first prayer</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {prayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} canPray />
          ))}
        </div>
      )}
    </AppShell>
  );
}
