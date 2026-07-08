import Link from "next/link";
import { cn } from "./ui";

export type FellowshipSection = "feed" | "messages";

const LINKS: { key: FellowshipSection; label: string; href: string }[] = [
  { key: "feed", label: "Feed", href: "/fellowship" },
  { key: "messages", label: "Messages", href: "/messages" },
];

/** Secondary nav within the Fellowship Social pillar. */
export function FellowshipSubnav({ active }: { active: FellowshipSection }) {
  return (
    <nav className="mb-4 flex gap-1 border-b border-line">
      {LINKS.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition",
            l.key === active
              ? "border-fellowship text-fellowship"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
