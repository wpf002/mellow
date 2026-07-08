import { z } from "zod";
import { dayStringSchema } from "./prayerLife.js";

// ---------------------------------------------------------------------------
// Prayer challenges (Phase 3). Progress is derived from PrayerDayMark events
// within the challenge window — never stored.
// ---------------------------------------------------------------------------

export const createChallengeSchema = z
  .object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(100),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    startDate: dayStringSchema,
    endDate: dayStringSchema,
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

export const challengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startDate: dayStringSchema,
  endDate: dayStringSchema,
  // Derived, never stored:
  participantCount: z.number().int().nonnegative(),
  viewerJoined: z.boolean(),
  progress: z.object({
    marked: z.number().int().nonnegative(), // prayer-days the viewer logged in-window
    target: z.number().int().positive(), // total days in the window
  }),
});
export type Challenge = z.infer<typeof challengeSchema>;
