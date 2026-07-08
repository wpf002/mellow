import Link from "next/link";
import type { Prayer } from "@mellow/shared";
import { Avatar } from "./Avatar";
import { Card } from "./ui";
import { PrayButton } from "./PrayButton";
import { formatDate } from "@/lib/format";

const visibilityLabel: Record<string, string> = {
  FRIENDS: "Friends",
  PRIVATE: "Private",
  GROUP: "Group",
};

/** Summary card used on the wall and profile prayers tab. */
export function PrayerCard({ prayer, canPray }: { prayer: Prayer; canPray: boolean }) {
  const { author } = prayer;
  const answered = prayer.status === "ANSWERED";
  const badge = visibilityLabel[prayer.visibility];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar name={author.displayName} src={author.avatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {author.handle ? (
              <Link href={`/${author.handle}`} className="font-semibold hover:underline">
                {author.displayName}
              </Link>
            ) : (
              <span className="font-semibold">{author.displayName}</span>
            )}
            {author.handle && <span className="text-sm text-muted">@{author.handle}</span>}
          </div>
          <span className="text-xs text-muted">{formatDate(prayer.createdAt)}</span>
        </div>
        {answered && (
          <span className="rounded-full bg-calling-soft px-2.5 py-1 text-xs font-semibold text-calling">
            ✓ Answered
          </span>
        )}
        {!answered && badge && (
          <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-muted">
            {badge}
          </span>
        )}
      </div>

      <Link href={`/prayers/${prayer.id}`} className="mt-3 block">
        {prayer.title && <h3 className="font-semibold">{prayer.title}</h3>}
        <p className="mt-1 line-clamp-4 text-sm whitespace-pre-wrap text-ink/90">{prayer.body}</p>
      </Link>

      {answered && prayer.testimonial && (
        <div className="mt-3 rounded-xl border border-calling-soft bg-calling-soft/40 p-3">
          <p className="text-xs font-semibold text-calling">Answered-prayer testimony</p>
          <p className="mt-1 line-clamp-3 text-sm whitespace-pre-wrap">{prayer.testimonial.body}</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4">
        <PrayButton
          prayerId={prayer.id}
          initialUniquePrayed={prayer.uniquePrayed}
          initialViewerHasPrayed={prayer.viewerHasPrayed}
          disabled={!canPray}
        />
        <Link href={`/prayers/${prayer.id}`} className="text-sm text-muted hover:underline">
          💬 {prayer.commentCount} {prayer.commentCount === 1 ? "comment" : "comments"}
        </Link>
      </div>
    </Card>
  );
}
