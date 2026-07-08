import { z } from "zod";
import { prayerAuthorSchema } from "./prayer.js";

// ---------------------------------------------------------------------------
// Fellowship Feed (Phase 4). Posts are the fellowship-pillar content entity.
// ---------------------------------------------------------------------------

export const reactionTypeSchema = z.enum(["AMEN", "PRAISE", "PRAYING", "LOVE"]);
export type ReactionType = z.infer<typeof reactionTypeSchema>;

/** Compose visibility (GROUP is prayer-only; not offered for posts). */
export const postVisibilitySchema = z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]);
export type PostVisibility = z.infer<typeof postVisibilitySchema>;

export const createPostSchema = z.object({
  body: z.string().trim().min(1, "Write something to share").max(2000),
  visibility: postVisibilitySchema.default("PUBLIC"),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const reactSchema = z.object({ type: reactionTypeSchema });
export type ReactInput = z.infer<typeof reactSchema>;

export const createPostCommentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment").max(1000),
});
export type CreatePostCommentInput = z.infer<typeof createPostCommentSchema>;

export const postCommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  createdAt: z.string(),
  author: prayerAuthorSchema,
});
export type PostComment = z.infer<typeof postCommentSchema>;

/** Reaction rollup for a post — derived, never stored. */
export const reactionSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  counts: z.object({
    AMEN: z.number().int().nonnegative(),
    PRAISE: z.number().int().nonnegative(),
    PRAYING: z.number().int().nonnegative(),
    LOVE: z.number().int().nonnegative(),
  }),
  viewerReaction: reactionTypeSchema.nullable(),
});
export type ReactionSummary = z.infer<typeof reactionSummarySchema>;

export const postSchema = z.object({
  id: z.string(),
  body: z.string(),
  visibility: z.enum(["PUBLIC", "FRIENDS", "GROUP", "PRIVATE"]),
  createdAt: z.string(),
  author: prayerAuthorSchema,
  isAuthor: z.boolean(),
  reactions: reactionSummarySchema,
  commentCount: z.number().int().nonnegative(),
});
export type Post = z.infer<typeof postSchema>;
