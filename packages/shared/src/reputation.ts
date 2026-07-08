import { z } from "zod";

// ---------------------------------------------------------------------------
// Reputation & Achievements (Phase 5) — OFF-CHAIN, no monetary value.
// Scores are derived weighted sums over append-only ReputationEvent rows.
// ---------------------------------------------------------------------------

export const reputationCategorySchema = z.enum([
  "PRAYER_POSTED",
  "INTERCESSION",
  "ENCOURAGEMENT",
  "TESTIMONY",
  "FELLOWSHIP",
  "FAITHFULNESS",
  "COMMUNITY",
]);
export type ReputationCategory = z.infer<typeof reputationCategorySchema>;

export const categoryBreakdownSchema = z.object({
  category: reputationCategorySchema,
  events: z.number().int().nonnegative(),
  points: z.number().int().nonnegative(),
});
export type CategoryBreakdown = z.infer<typeof categoryBreakdownSchema>;

/** Derived reputation view for a user. Never stored. */
export const reputationSchema = z.object({
  score: z.number().int().nonnegative(),
  breakdown: z.array(categoryBreakdownSchema),
});
export type Reputation = z.infer<typeof reputationSchema>;

export const achievementSchema = z.object({
  code: z.string(),
  title: z.string(),
  description: z.string(),
  awardedAt: z.string().nullable(), // null = not yet earned (catalog view)
});
export type AchievementView = z.infer<typeof achievementSchema>;
