import { z } from "zod";
import { prayerAuthorSchema } from "./prayer.js";

// ---------------------------------------------------------------------------
// Notifications — an in-app activity feed. Never notify your own actions.
// ---------------------------------------------------------------------------

export const notificationTypeSchema = z.enum([
  "FOLLOW",
  "PRAYER_PRAYED",
  "PRAYER_COMMENT",
  "PRAYER_ANSWERED",
  "POST_REACTION",
  "POST_COMMENT",
  "COURSE_ENROLLED",
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

/** Human-readable verb per type (the actor's name is prepended in the UI). */
export const NOTIFICATION_VERB: Record<NotificationType, string> = {
  FOLLOW: "followed you",
  PRAYER_PRAYED: "prayed for your prayer",
  PRAYER_COMMENT: "commented on your prayer",
  PRAYER_ANSWERED: "marked a prayer answered",
  POST_REACTION: "reacted to your post",
  POST_COMMENT: "commented on your post",
  COURSE_ENROLLED: "enrolled in your course",
};

/** Where a notification links, by type + entityId. */
export function notificationHref(type: NotificationType, entityId: string | null, actorHandle: string | null): string | null {
  switch (type) {
    case "FOLLOW":
      return actorHandle ? `/${actorHandle}` : null;
    case "PRAYER_PRAYED":
    case "PRAYER_COMMENT":
    case "PRAYER_ANSWERED":
      return entityId ? `/prayers/${entityId}` : null;
    case "POST_REACTION":
    case "POST_COMMENT":
      return entityId ? `/fellowship/${entityId}` : null;
    case "COURSE_ENROLLED":
      return entityId ? `/equipping/${entityId}` : null;
    default:
      return null;
  }
}

export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  entityId: z.string().nullable(),
  read: z.boolean(),
  createdAt: z.string(),
  actor: prayerAuthorSchema,
});
export type Notification = z.infer<typeof notificationSchema>;
