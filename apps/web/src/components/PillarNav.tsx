import Link from "next/link";
import type { PublicUser } from "@mellow/shared";
import type { Pillar } from "./PillarTabs";
import { Avatar } from "./Avatar";
import { SearchBox } from "./SearchBox";
import { NotificationBell } from "./NotificationBell";
import { Button, Card, cn } from "./ui";

// ---------------------------------------------------------------------------
// The 3-column app frame's nav (per the deck's design language): a left filter
// nav and a right utility rail, keyed by pillar. All links go to real routes.
// ---------------------------------------------------------------------------

type NavItem = { key: string; label: string; href: string };
type RailLink = { label: string; href: string };

type PillarNavConfig = {
  active: string; // active left-nav pill classes
  idle: string; // idle left-nav pill classes
  left: NavItem[];
  rail: RailLink[]; // contextual quick links in the right rail
};

export const PILLAR_NAV: Record<Pillar, PillarNavConfig> = {
  prayer: {
    active: "bg-prayer text-white",
    idle: "text-ink hover:bg-prayer-soft/50",
    left: [
      { key: "wall", label: "Prayer Wall", href: "/" },
      { key: "groups", label: "Prayer Groups", href: "/groups" },
      { key: "life", label: "Prayer Life", href: "/prayer-life" },
    ],
    rail: [
      { label: "Prayer Life", href: "/prayer-life" },
      { label: "Prayer Groups", href: "/groups" },
      { label: "Messages", href: "/messages" },
    ],
  },
  fellowship: {
    active: "bg-fellowship text-white",
    idle: "text-ink hover:bg-fellowship-soft/50",
    left: [
      { key: "feed", label: "Feed", href: "/fellowship" },
      { key: "messages", label: "Messages", href: "/messages" },
    ],
    rail: [{ label: "Messages", href: "/messages" }],
  },
  calling: {
    active: "bg-calling text-white",
    idle: "text-ink hover:bg-calling-soft/50",
    left: [
      { key: "openings", label: "Openings", href: "/calling" },
      { key: "talent", label: "Talent", href: "/calling/talent" },
    ],
    rail: [
      { label: "Talent Directory", href: "/calling/talent" },
      { label: "Messages", href: "/messages" },
    ],
  },
  equipping: {
    active: "bg-equipping text-white",
    idle: "text-equipping-ink hover:bg-equipping-soft/60",
    left: [
      { key: "courses", label: "Courses", href: "/equipping" },
      { key: "learning", label: "My Learning", href: "/equipping/my" },
    ],
    rail: [
      { label: "My Learning", href: "/equipping/my" },
      { label: "Messages", href: "/messages" },
    ],
  },
};

/** Left filter nav: search + per-pillar sections. Horizontal on mobile. */
export function LeftNav({
  pillar,
  section,
  className,
}: {
  pillar: Pillar;
  section?: string;
  className?: string;
}) {
  const cfg = PILLAR_NAV[pillar];
  return (
    <nav
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0",
        className,
      )}
    >
      <SearchBox />
      {cfg.left.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition",
            item.key === section ? cfg.active : cfg.idle,
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Right utility rail: the "Profile" card + contextual quick links. */
export function RightRail({
  pillar,
  me,
  className,
}: {
  pillar: Pillar;
  me: PublicUser | null;
  className?: string;
}) {
  const cfg = PILLAR_NAV[pillar];
  return (
    <aside className={cn("space-y-3", className)}>
      {me?.handle ? (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Avatar name={me.displayName ?? me.handle} src={me.avatarUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me.displayName ?? me.handle}</p>
              <p className="truncate text-xs text-muted">@{me.handle}</p>
            </div>
          </div>
          <Link href={`/${me.handle}`} className="mt-3 block">
            <Button variant="outline" className="w-full">
              Profile
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted">Sign in to personalize Mellow.</p>
          <Link href="/sign-in" className="mt-3 block">
            <Button className="w-full">Login</Button>
          </Link>
        </Card>
      )}

      <Card className="p-2">
        {cfg.rail.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-black/5"
          >
            {l.label}
          </Link>
        ))}
        {me?.handle && <NotificationBell />}
      </Card>
    </aside>
  );
}
