import { z } from "zod";

/**
 * A handle is the public `@username`. Lowercase, 3–20 chars, letters/numbers/underscore,
 * must start with a letter. Immutable once set (enforced in the API).
 */
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Handle must be at least 3 characters")
  .max(20, "Handle must be at most 20 characters")
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Handle must start with a letter and use only lowercase letters, numbers, and underscores",
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(50, "Display name must be at most 50 characters");

export const bioSchema = z.string().trim().max(280, "Bio must be at most 280 characters");

// IANA timezone. Kept permissive here; the UI supplies values from a real tz list.
export const timezoneSchema = z.string().trim().min(1).max(64);

export const avatarUrlSchema = z.string().trim().url("Must be a valid URL").max(2048);

/** Onboarding: claim a handle + set display name + timezone. */
export const onboardingSchema = z.object({
  handle: handleSchema,
  displayName: displayNameSchema,
  timezone: timezoneSchema.default("UTC"),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/**
 * Profile update. All fields optional (partial patch). `handle` may be included
 * only while still unset — the API rejects attempts to change an existing handle.
 */
export const profileUpdateSchema = z
  .object({
    handle: handleSchema.optional(),
    displayName: displayNameSchema.optional(),
    bio: bioSchema.optional(),
    avatarUrl: avatarUrlSchema.optional().or(z.literal("")),
    timezone: timezoneSchema.optional(),
  })
  .strict();
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/** Public shape of a user profile returned by the API. */
export const publicUserSchema = z.object({
  id: z.string(),
  handle: z.string().nullable(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: z.string(),
  followerCount: z.number().int().nonnegative(),
  followingCount: z.number().int().nonnegative(),
  isFollowedByViewer: z.boolean(),
  isViewer: z.boolean(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

/** Private view of the signed-in user (adds fields only the owner should see). */
export const meUserSchema = publicUserSchema.extend({
  email: z.string(),
  timezone: z.string(),
});
export type MeUser = z.infer<typeof meUserSchema>;
