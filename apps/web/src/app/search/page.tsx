import Link from "next/link";
import type { SearchHit } from "@mellow/shared";
import { getMe, getSearchResults } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui";

function ResultGroup({
  title,
  hits,
  hrefFor,
}: {
  title: string;
  hits: SearchHit[];
  hrefFor: (id: string) => string;
}) {
  if (hits.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-muted">{title}</h2>
      <div className="space-y-2">
        {hits.map((h) => (
          <Link key={h.id} href={hrefFor(h.id)}>
            <Card className="p-4 transition hover:border-prayer/50">
              <p className="font-medium">{h.title}</p>
              <p className="text-sm text-muted">{h.subtitle}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const [me, results] = await Promise.all([getMe(), getSearchResults(q)]);

  const total =
    results.people.length +
    results.prayers.length +
    results.posts.length +
    results.jobs.length +
    results.courses.length;

  return (
    <AppShell me={me} pillar="prayer">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-bold">
          {q ? `Results for “${q}”` : "Search Mellow"}
        </h1>

        {q && total === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-sm text-muted">No matches. Try another term.</p>
          </Card>
        ) : (
          <>
            {results.people.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold text-muted">People</h2>
                <div className="space-y-2">
                  {results.people.map((p) => (
                    <Link key={p.id} href={p.handle ? `/${p.handle}` : "#"}>
                      <Card className="flex items-center gap-3 p-4 transition hover:border-prayer/50">
                        <Avatar name={p.displayName} src={p.avatarUrl} size={40} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.displayName}</p>
                          {p.handle && <p className="truncate text-sm text-muted">@{p.handle}</p>}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <ResultGroup title="Prayers" hits={results.prayers} hrefFor={(id) => `/prayers/${id}`} />
            <ResultGroup title="Fellowship" hits={results.posts} hrefFor={(id) => `/fellowship/${id}`} />
            <ResultGroup title="Openings" hits={results.jobs} hrefFor={(id) => `/calling/${id}`} />
            <ResultGroup title="Courses" hits={results.courses} hrefFor={(id) => `/equipping/${id}`} />
          </>
        )}
      </div>
    </AppShell>
  );
}
