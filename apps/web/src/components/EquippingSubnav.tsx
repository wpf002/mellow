import Link from "next/link";
import { cn } from "./ui";

export type EquippingSection = "courses" | "learning";

const LINKS: { key: EquippingSection; label: string; href: string }[] = [
  { key: "courses", label: "Courses", href: "/equipping" },
  { key: "learning", label: "My Learning", href: "/equipping/my" },
];

/** Secondary nav within the Equipping Center pillar. */
export function EquippingSubnav({ active }: { active: EquippingSection }) {
  return (
    <nav className="mb-4 flex gap-1 border-b border-line">
      {LINKS.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition",
            l.key === active
              ? "border-equipping text-equipping-ink"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
