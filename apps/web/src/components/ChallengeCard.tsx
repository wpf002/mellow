import type { Challenge } from "@mellow/shared";
import { Card } from "./ui";
import { JoinChallengeButton } from "./JoinChallengeButton";
import { formatDay } from "@/lib/format";

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { marked, target } = challenge.progress;
  const pct = target > 0 ? Math.min(100, Math.round((marked / target) * 100)) : 0;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold">{challenge.title}</h3>
          <p className="text-xs text-muted">
            {formatDay(challenge.startDate)} – {formatDay(challenge.endDate)} ·{" "}
            {challenge.participantCount} joined
          </p>
        </div>
        <JoinChallengeButton challengeId={challenge.id} initialJoined={challenge.viewerJoined} />
      </div>

      {challenge.description && (
        <p className="mt-2 text-sm whitespace-pre-wrap text-ink/90">{challenge.description}</p>
      )}

      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted">
          <span>Your progress</span>
          <span className="tabular-nums">
            {marked} / {target} days
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/[0.06]">
          <div className="h-full rounded-full bg-prayer" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Card>
  );
}
