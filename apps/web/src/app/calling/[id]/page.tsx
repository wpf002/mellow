import Link from "next/link";
import { notFound } from "next/navigation";
import { JOB_TYPE_LABEL } from "@mellow/shared";
import { getJob, getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Button, Card } from "@/components/ui";
import { MessageButton } from "@/components/MessageButton";
import { CloseJobButton } from "@/components/CloseJobButton";
import { formatDate } from "@/lib/format";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, job] = await Promise.all([getMe(), getJob(id)]);
  if (!job) notFound();

  const closed = job.status === "CLOSED";

  return (
    <AppShell me={me} pillar="calling" section="openings">
      <div className="mx-auto max-w-2xl">
        <Link href="/calling" className="text-sm text-muted hover:underline">
          ← All Openings
        </Link>

        <Card className="mt-2 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <p className="mt-1 text-sm text-muted">
                {job.orgName ?? job.poster.displayName}
                {job.remote ? " · Remote" : job.location ? ` · ${job.location}` : ""}
                {" · Posted "}
                {formatDate(job.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="rounded-full bg-calling-soft px-2.5 py-1 text-xs font-semibold text-calling">
                {JOB_TYPE_LABEL[job.type]}
              </span>
              {closed && (
                <span className="rounded-full bg-black/10 px-2.5 py-1 text-xs font-semibold text-muted">
                  Closed
                </span>
              )}
            </div>
          </div>

          <p className="mt-4 text-[15px] whitespace-pre-wrap text-ink/90">{job.description}</p>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-4">
            <div className="flex items-center gap-3">
              <Avatar name={job.poster.displayName} src={job.poster.avatarUrl} size={36} />
              <div>
                {job.poster.handle ? (
                  <Link href={`/${job.poster.handle}`} className="text-sm font-semibold hover:underline">
                    {job.poster.displayName}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold">{job.poster.displayName}</span>
                )}
                <p className="text-xs text-muted">Poster</p>
              </div>
            </div>
            <div className="flex gap-2">
              {job.isPoster && !closed && <CloseJobButton jobId={job.id} />}
              {!job.isPoster &&
                !closed &&
                (me && job.poster.handle ? (
                  <MessageButton handle={job.poster.handle} />
                ) : (
                  <Link href="/sign-in">
                    <Button variant="outline">Sign In to Reach Out</Button>
                  </Link>
                ))}
            </div>
          </div>
        </Card>

        <p className="mt-3 text-center text-xs text-muted">
          Reaching out happens in Messages. Mellow charges no fees and handles no payments.
        </p>
      </div>
    </AppShell>
  );
}
