/**
 * Deterministic date formatting (fixed locale + UTC) so server and client render
 * identical strings and React doesn't warn about hydration mismatches.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Today's local calendar day (YYYY-MM-DD) in the given IANA timezone. */
export function localToday(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** The `n` calendar days ending at `todayYmd` (inclusive), ascending. */
export function recentDays(todayYmd: string, n: number): string[] {
  const [y, m, d] = todayYmd.split("-").map(Number);
  const end = Date.UTC(y!, m! - 1, d!);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(end - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

/** Short label for a day cell, e.g. "Jul 7" (interpreted as a UTC-labelled day). */
export function formatDay(ymd: string): string {
  return new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
