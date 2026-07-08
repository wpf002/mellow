/**
 * Timezone-aware prayer-streak math. Prayer days are stored as append-only
 * PrayerDayMark rows (one per local calendar day); the streak is derived here,
 * never stored. All reasoning is on calendar-day *labels* (YYYY-MM-DD), so a
 * streak survives timezone/DST wall-clock shifts — only date adjacency matters.
 */

/** The local calendar day (YYYY-MM-DD) for an instant in the given IANA tz. */
export function localDayString(instant: Date, timeZone: string): string {
  // en-CA renders ISO-style YYYY-MM-DD; build from parts to be locale-proof.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** A `@db.Date` value comes back at UTC midnight; take its date label directly. */
export function dbDateToDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse a YYYY-MM-DD label to a whole-day index (days since the epoch). */
export function dayIndex(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, d!) / 86_400_000);
}

/** Inclusive number of calendar days in [startYmd, endYmd]. */
export function daysInWindow(startYmd: string, endYmd: string): number {
  return dayIndex(endYmd) - dayIndex(startYmd) + 1;
}

export interface StreakResult {
  current: number;
  longest: number;
  todayMarked: boolean;
}

/**
 * Compute current + longest streaks from marked day labels, relative to today's
 * local label. The current streak counts the consecutive run ending today; if
 * today isn't marked yet but yesterday was, the run through yesterday still
 * counts (it's alive, just not extended today).
 */
export function computeStreak(markedYmds: string[], todayYmd: string): StreakResult {
  const indices = markedYmds.map(dayIndex);
  const present = new Set(indices);
  const todayIdx = dayIndex(todayYmd);

  const todayMarked = present.has(todayIdx);
  let anchor: number | null = null;
  if (todayMarked) anchor = todayIdx;
  else if (present.has(todayIdx - 1)) anchor = todayIdx - 1;

  let current = 0;
  if (anchor !== null) {
    let i = anchor;
    while (present.has(i)) {
      current++;
      i--;
    }
  }

  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const idx of [...indices].sort((a, b) => a - b)) {
    run = prev !== null && idx === prev + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = idx;
  }

  return { current, longest, todayMarked };
}
