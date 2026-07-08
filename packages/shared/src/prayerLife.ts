import { z } from "zod";

// ---------------------------------------------------------------------------
// Prayer Life (Phase 3) — daily marks + derived streaks.
// Everything here is computed from append-only PrayerDayMark events in the
// user's timezone; nothing is stored.
// ---------------------------------------------------------------------------

/** A local calendar day, `YYYY-MM-DD`. */
export const dayStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const streakSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
  todayMarked: z.boolean(),
  markedDates: z.array(dayStringSchema), // recent marked local days, ascending
});
export type Streak = z.infer<typeof streakSchema>;
