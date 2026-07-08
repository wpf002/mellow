import Link from "next/link";
import { JOB_TYPE_LABEL, type Job } from "@mellow/shared";
import { Card } from "./ui";
import { formatDate } from "@/lib/format";

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/calling/${job.id}`}>
      <Card className="p-5 transition hover:border-calling/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold">{job.title}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {job.orgName ?? job.poster.displayName}
              {job.remote ? " · Remote" : job.location ? ` · ${job.location}` : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-calling-soft px-2.5 py-1 text-xs font-semibold text-calling">
            {JOB_TYPE_LABEL[job.type]}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-ink/90">{job.description}</p>
        <p className="mt-3 text-xs text-muted">Posted {formatDate(job.createdAt)}</p>
      </Card>
    </Link>
  );
}
