import type { AchievementView, Reputation, ReputationCategory } from "@mellow/shared";
import { Card, cn } from "./ui";

const CATEGORY_LABEL: Record<ReputationCategory, string> = {
  PRAYER_POSTED: "Prayers shared",
  INTERCESSION: "Intercession",
  ENCOURAGEMENT: "Encouragement",
  TESTIMONY: "Testimonies",
  FELLOWSHIP: "Fellowship",
  FAITHFULNESS: "Faithfulness",
  COMMUNITY: "Community",
};

const BADGE_EMOJI: Record<string, string> = {
  FIRST_PRAYER: "🕊️",
  INTERCESSOR: "🙏",
  INTERCESSOR_10: "⚔️",
  ENCOURAGER: "💬",
  WITNESS: "📖",
  FELLOWSHIP_VOICE: "🗣️",
  DAILY_BREAD: "🍞",
  COMMUNITY_BUILDER: "🏛️",
};

/** Profile reputation: derived score, per-category breakdown, badge shelf. */
export function ReputationCard({
  reputation,
  achievements,
}: {
  reputation: Reputation;
  achievements: AchievementView[];
}) {
  const earned = achievements.filter((a) => a.awardedAt);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-muted">Serve reputation</h2>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-prayer">{reputation.score}</span>
            <span className="text-xs text-muted">points · no monetary value</span>
          </div>
        </div>
      </div>

      {reputation.breakdown.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {reputation.breakdown.map((b) => (
            <span
              key={b.category}
              className="rounded-full bg-black/5 px-3 py-1 text-xs text-muted"
              title={`${b.events} event${b.events === 1 ? "" : "s"}`}
            >
              {CATEGORY_LABEL[b.category]} · <strong className="text-ink">{b.points}</strong>
            </span>
          ))}
        </div>
      )}

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-muted">
          Achievements · {earned.length}/{achievements.length}
        </h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {achievements.map((a) => {
            const isEarned = Boolean(a.awardedAt);
            return (
              <div
                key={a.code}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3",
                  isEarned ? "border-equipping/60 bg-equipping-soft/40" : "border-line opacity-50",
                )}
              >
                <span className="text-xl" aria-hidden>
                  {BADGE_EMOJI[a.code] ?? "🏅"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="truncate text-xs text-muted">{a.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
