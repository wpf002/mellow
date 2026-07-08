import Link from "next/link";
import { cn } from "./ui";

export type Pillar = "prayer" | "fellowship" | "calling" | "equipping";

const PILLARS: { key: Pillar; label: string; href: string; active: string; idle: string }[] = [
  {
    key: "prayer",
    label: "Prayer Social",
    href: "/",
    active: "bg-prayer text-white",
    idle: "border border-prayer/40 text-prayer hover:bg-prayer-soft/40",
  },
  {
    key: "fellowship",
    label: "Fellowship Social",
    href: "/fellowship",
    active: "bg-fellowship text-white",
    idle: "border border-fellowship/40 text-fellowship hover:bg-fellowship-soft/40",
  },
  {
    key: "calling",
    label: "Calling Center",
    href: "/calling",
    active: "bg-calling text-white",
    idle: "border border-calling/40 text-calling hover:bg-calling-soft/40",
  },
  {
    key: "equipping",
    label: "Equipping Center",
    href: "/equipping",
    active: "bg-equipping text-white",
    idle: "border border-equipping/50 text-equipping-ink hover:bg-equipping-soft/50",
  },
];

export function PillarTabs({ active }: { active: Pillar }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {PILLARS.map((p) => (
        <Link
          key={p.key}
          href={p.href}
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
            p.key === active ? p.active : p.idle,
          )}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
