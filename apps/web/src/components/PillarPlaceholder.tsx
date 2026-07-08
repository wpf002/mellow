import { Card } from "./ui";

/** Temporary landing for pillars whose feature build lands in a later phase. */
export function PillarPlaceholder({
  title,
  tagline,
  accent,
  phase,
}: {
  title: string;
  tagline: string;
  accent: string;
  phase: string;
}) {
  return (
    <Card className="p-8">
      <h1 className={`text-2xl font-bold ${accent}`}>{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{tagline}</p>
      <p className="mt-4 inline-block rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-muted">
        Building in {phase}
      </p>
    </Card>
  );
}
