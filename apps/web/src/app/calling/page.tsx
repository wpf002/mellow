import Link from "next/link";
import { JOB_TYPE_LABEL, jobTypeSchema, type JobType } from "@mellow/shared";
import { getJobs, getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { CallingSubnav } from "@/components/CallingSubnav";
import { JobCard } from "@/components/JobCard";
import { Button, Card, cn } from "@/components/ui";

export default async function CallingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = jobTypeSchema.safeParse(params.type);
  const type: JobType | undefined = typeFilter.success ? typeFilter.data : undefined;

  const [me, { items: jobs }] = await Promise.all([getMe(), getJobs(type)]);

  return (
    <AppShell me={me} pillar="calling">
      <CallingSubnav active="openings" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/calling"
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              !type ? "bg-calling text-white" : "border border-calling/40 text-calling hover:bg-calling-soft/40",
            )}
          >
            All
          </Link>
          {(Object.keys(JOB_TYPE_LABEL) as JobType[]).map((t) => (
            <Link
              key={t}
              href={`/calling?type=${t}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                type === t ? "bg-calling text-white" : "border border-calling/40 text-calling hover:bg-calling-soft/40",
              )}
            >
              {JOB_TYPE_LABEL[t]}
            </Link>
          ))}
        </div>
        {me && (
          <Link href="/calling/new">
            <Button className="bg-calling hover:brightness-95">Post an opening</Button>
          </Link>
        )}
      </div>

      {jobs.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-semibold">No open callings{type ? " of this type" : ""} yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Churches, ministries, and believers post openings here — jobs, volunteering, and
            missions. Reaching out happens through messages; Mellow takes no fees.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
