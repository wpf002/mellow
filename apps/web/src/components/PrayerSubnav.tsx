import Link from "next/link";
import { cn } from "./ui";

export type PrayerSection = "wall" | "groups" | "life";

const LINKS: { key: PrayerSection; label: string; href: string }[] = [
  { key: "wall", label: "Wall", href: "/" },
  { key: "groups", label: "Groups", href: "/groups" },
  { key: "life", label: "Prayer Life", href: "/prayer-life" },
];

/** Secondary nav within the Prayer Social pillar. */
export function PrayerSubnav({ active }: { active: PrayerSection }) {
  return (
    <nav className="mb-4 flex gap-1 border-b border-line">
      {LINKS.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition",
            l.key === active
              ? "border-prayer text-prayer"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
