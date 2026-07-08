import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanionEnabled, getMe, getPrayer, getPrayerComments } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui";
import { PrayButton } from "@/components/PrayButton";
import { CommentComposer } from "@/components/CommentComposer";
import { AnswerPrayerForm } from "@/components/AnswerPrayerForm";
import { ThreadSummaryButton } from "@/components/ThreadSummaryButton";
import { formatDate } from "@/lib/format";

const visibilityLabel: Record<string, string> = {
  FRIENDS: "Friends only",
  PRIVATE: "Private",
  GROUP: "Group",
};

export default async function PrayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, prayer, companionEnabled] = await Promise.all([
    getMe(),
    getPrayer(id),
    getCompanionEnabled(),
  ]);
  if (!prayer) notFound();

  const { items: comments } = await getPrayerComments(id);
  const { author } = prayer;
  const answered = prayer.status === "ANSWERED";
  const badge = visibilityLabel[prayer.visibility];

  return (
    <AppShell me={me} pillar="prayer">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-muted hover:underline">
          ← Back to the Wall
        </Link>

        <Card className="mt-2 p-6">
          <div className="flex items-center gap-3">
            <Avatar name={author.displayName} src={author.avatarUrl} size={44} />
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
            {answered ? (
              <span className="rounded-full bg-calling-soft px-3 py-1 text-xs font-semibold text-calling">
                ✓ Answered
              </span>
            ) : (
              badge && (
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-muted">
                  {badge}
                </span>
              )
            )}
          </div>

          {prayer.title && <h1 className="mt-4 text-xl font-bold">{prayer.title}</h1>}
          <p className="mt-2 text-[15px] whitespace-pre-wrap text-ink/90">{prayer.body}</p>
          {prayer.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={prayer.imageUrl}
              alt=""
              className="mt-4 max-h-96 w-full rounded-xl border border-line object-cover"
            />
          )}

          <div className="mt-5 flex items-center gap-4">
            <PrayButton
              prayerId={prayer.id}
              initialUniquePrayed={prayer.uniquePrayed}
              initialViewerHasPrayed={prayer.viewerHasPrayed}
              disabled={!me}
            />
            <span className="text-sm text-muted">
              {prayer.uniquePrayed} {prayer.uniquePrayed === 1 ? "person has" : "people have"} prayed
              {prayer.totalPrayed !== prayer.uniquePrayed && ` · ${prayer.totalPrayed} prayers`}
            </span>
          </div>
        </Card>

        {/* Testimonial / mark-answered */}
        {answered && prayer.testimonial ? (
          <Card className="mt-4 border-calling-soft bg-calling-soft/30 p-6">
            <p className="text-sm font-semibold text-calling">Answered-Prayer Testimony</p>
            <p className="mt-2 text-sm whitespace-pre-wrap">{prayer.testimonial.body}</p>
            <p className="mt-3 text-xs text-muted">
              Answered {prayer.answeredAt ? formatDate(prayer.answeredAt) : ""}
            </p>
          </Card>
        ) : (
          prayer.isAuthor && (
            <Card className="mt-4 p-6">
              <AnswerPrayerForm prayerId={prayer.id} />
            </Card>
          )
        )}

        {/* Companion thread summary (read-only; shown only when AI is enabled) */}
        {me && companionEnabled && prayer.commentCount > 0 && (
          <div className="mt-4">
            <ThreadSummaryButton prayerId={prayer.id} />
          </div>
        )}

        {/* Comments */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-muted">
            {prayer.commentCount} {prayer.commentCount === 1 ? "Comment" : "Comments"}
          </h2>

          {me ? (
            <Card className="p-4">
              <CommentComposer prayerId={prayer.id} />
            </Card>
          ) : (
            <Card className="p-4 text-center text-sm text-muted">
              <Link href="/sign-in" className="text-brand hover:underline">
                Sign In
              </Link>{" "}
              to comment and pray.
            </Card>
          )}

          <div className="mt-3 space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={comment.author.displayName} src={comment.author.avatarUrl} size={32} />
                  <div className="flex items-center gap-2">
                    {comment.author.handle ? (
                      <Link
                        href={`/${comment.author.handle}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        {comment.author.displayName}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold">{comment.author.displayName}</span>
                    )}
                    <span className="text-xs text-muted">{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap text-ink/90">{comment.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
