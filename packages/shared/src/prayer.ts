import { z } from "zod";

// ---------------------------------------------------------------------------
// Prayer Social (Phase 2) — one shared schema per entity, used by web + api.
// ---------------------------------------------------------------------------

/**
 * Visibility options a user can pick when composing. GROUP is deferred to
 * Phase 3 (prayer groups), so it is not offered here; the query layer still
 * understands the full DB `Visibility` enum.
 */
export const prayerVisibilitySchema = z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]);
export type PrayerVisibility = z.infer<typeof prayerVisibilitySchema>;

export const prayerStatusSchema = z.enum(["OPEN", "ANSWERED"]);
export type PrayerStatus = z.infer<typeof prayerStatusSchema>;

const titleSchema = z.string().trim().max(120, "Title must be at most 120 characters");
const prayerBodySchema = z
  .string()
  .trim()
  .min(1, "Write your prayer request")
  .max(2000, "Prayer must be at most 2000 characters");
const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Write a comment")
  .max(1000, "Comment must be at most 1000 characters");
const testimonialBodySchema = z
  .string()
  .trim()
  .min(1, "Share how this prayer was answered")
  .max(2000, "Testimonial must be at most 2000 characters");

/** Optional image attached by URL (no upload backend yet). */
export const imageUrlSchema = z.string().trim().url("Must be a valid image URL").max(2048);

/** Compose a new prayer request. */
export const createPrayerSchema = z.object({
  // Empty title collapses to undefined so the column stays null.
  title: titleSchema.optional().or(z.literal("")),
  body: prayerBodySchema,
  imageUrl: imageUrlSchema.optional().or(z.literal("")),
  visibility: prayerVisibilitySchema.default("PUBLIC"),
});
export type CreatePrayerInput = z.infer<typeof createPrayerSchema>;

/** Add a comment to a prayer. */
export const createCommentSchema = z.object({ body: commentBodySchema });
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/** Mark a prayer answered, attaching a testimonial. */
export const answerPrayerSchema = z.object({ body: testimonialBodySchema });
export type AnswerPrayerInput = z.infer<typeof answerPrayerSchema>;

/** Compact author view embedded in prayer/comment payloads. */
export const prayerAuthorSchema = z.object({
  id: z.string(),
  handle: z.string().nullable(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
});
export type PrayerAuthor = z.infer<typeof prayerAuthorSchema>;

export const testimonialSchema = z.object({
  id: z.string(),
  body: z.string(),
  createdAt: z.string(),
});
export type Testimonial = z.infer<typeof testimonialSchema>;

export const commentSchema = z.object({
  id: z.string(),
  body: z.string(),
  createdAt: z.string(),
  author: prayerAuthorSchema,
});
export type Comment = z.infer<typeof commentSchema>;

/** Public view of a prayer, with derived counts and viewer-relative flags. */
export const prayerSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  body: z.string(),
  imageUrl: z.string().nullable(),
  visibility: z.enum(["PUBLIC", "FRIENDS", "GROUP", "PRIVATE"]),
  status: prayerStatusSchema,
  createdAt: z.string(),
  answeredAt: z.string().nullable(),
  author: prayerAuthorSchema,
  // Set when the prayer was posted into a group (visibility = GROUP).
  group: z.object({ id: z.string(), name: z.string() }).nullable(),
  // Derived, never stored:
  uniquePrayed: z.number().int().nonnegative(),
  totalPrayed: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  viewerHasPrayed: z.boolean(),
  isAuthor: z.boolean(),
  testimonial: testimonialSchema.nullable(),
});
export type Prayer = z.infer<typeof prayerSchema>;
