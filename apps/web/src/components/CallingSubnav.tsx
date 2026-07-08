import Link from "next/link";
import { cn } from "./ui";

export type CallingSection = "openings" | "talent";

const LINKS: { key: CallingSection; label: string; href: string }[] = [
  { key: "openings", label: "Openings", href: "/calling" },
  { key: "talent", label: "Talent", href: "/calling/talent" },
];

/** Secondary nav within the Calling Center pillar. */
export function CallingSubnav({ active }: { active: CallingSection }) {
  return (
    <nav className="mb-4 flex gap-1 border-b border-line">
      {LINKS.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition",
            l.key === active
              ? "border-calling text-calling"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
