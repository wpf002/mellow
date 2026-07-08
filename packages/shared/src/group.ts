import { z } from "zod";
import { prayerAuthorSchema } from "./prayer.js";

// ---------------------------------------------------------------------------
// Prayer groups (Phase 3).
// ---------------------------------------------------------------------------

export const groupRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);
export type GroupRole = z.infer<typeof groupRoleSchema>;

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  description: z.string().trim().max(280).optional().or(z.literal("")),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

/** Post a prayer into a group. Visibility is always GROUP (set server-side). */
export const createGroupPrayerSchema = z.object({
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(1, "Write your prayer request").max(2000),
});
export type CreateGroupPrayerInput = z.infer<typeof createGroupPrayerSchema>;

export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  owner: prayerAuthorSchema,
  // Derived, never stored:
  memberCount: z.number().int().nonnegative(),
  viewerRole: groupRoleSchema.nullable(), // null when the viewer is not a member
});
export type Group = z.infer<typeof groupSchema>;
