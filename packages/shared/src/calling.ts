import { z } from "zod";
import { prayerAuthorSchema } from "./prayer.js";

// ---------------------------------------------------------------------------
// Calling Center (Phase 7) — listings surface only. Marketplace mechanics
// (fees, payouts, match AI, applications) stay deferred behind review;
// contact goes through the existing 1:1 messaging.
// ---------------------------------------------------------------------------

export const jobTypeSchema = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "VOLUNTEER", "MISSION"]);
export type JobType = z.infer<typeof jobTypeSchema>;

export const jobStatusSchema = z.enum(["OPEN", "CLOSED"]);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  VOLUNTEER: "Volunteer",
  MISSION: "Mission",
};

export const createJobSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  orgName: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().min(1, "Describe the opportunity").max(5000),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  remote: z.boolean().default(false),
  type: jobTypeSchema.default("FULL_TIME"),
});
export type CreateJobInput = z.infer<typeof createJobSchema>;

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  orgName: z.string().nullable(),
  description: z.string(),
  location: z.string().nullable(),
  remote: z.boolean(),
  type: jobTypeSchema,
  status: jobStatusSchema,
  createdAt: z.string(),
  poster: prayerAuthorSchema,
  isPoster: z.boolean(),
});
export type Job = z.infer<typeof jobSchema>;

export const upsertTalentSchema = z.object({
  headline: z.string().trim().min(3, "Add a short headline").max(120),
  about: z.string().trim().max(2000).optional().or(z.literal("")),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  availability: z.string().trim().max(120).optional().or(z.literal("")),
  visible: z.boolean().default(true),
});
export type UpsertTalentInput = z.infer<typeof upsertTalentSchema>;

export const talentSchema = z.object({
  headline: z.string(),
  about: z.string().nullable(),
  skills: z.array(z.string()),
  availability: z.string().nullable(),
  visible: z.boolean(),
  updatedAt: z.string(),
  user: prayerAuthorSchema,
  isViewer: z.boolean(),
});
export type Talent = z.infer<typeof talentSchema>;
