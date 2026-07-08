import { z } from "zod";
import { handleSchema } from "./user.js";
import { prayerAuthorSchema } from "./prayer.js";

// ---------------------------------------------------------------------------
// Messaging (Phase 4). 1:1 direct messages for the MVP; unread counts derived.
// ---------------------------------------------------------------------------

/** Start (or reuse) a 1:1 conversation with the given user. */
export const startConversationSchema = z.object({ handle: handleSchema });
export type StartConversationInput = z.infer<typeof startConversationSchema>;

/** Start a group chat with 2+ other users. */
export const startGroupSchema = z.object({
  title: z.string().trim().min(1, "Name the group").max(80),
  handles: z.array(handleSchema).min(2, "Add at least two people").max(20),
});
export type StartGroupInput = z.infer<typeof startGroupSchema>;

export const createMessageSchema = z.object({
  body: z.string().trim().min(1, "Write a message").max(2000),
});
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const messageSchema = z.object({
  id: z.string(),
  body: z.string(),
  createdAt: z.string(),
  senderId: z.string(),
  mine: z.boolean(), // sent by the viewer
  sender: prayerAuthorSchema, // shown on incoming bubbles in group chats
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  updatedAt: z.string(),
  isGroup: z.boolean(),
  title: z.string().nullable(), // group name; null for 1:1
  // Other participants (all of them for groups; the single other for 1:1).
  members: z.array(prayerAuthorSchema),
  otherMember: prayerAuthorSchema.nullable(),
  lastMessage: z
    .object({ body: z.string(), createdAt: z.string(), mine: z.boolean() })
    .nullable(),
  unreadCount: z.number().int().nonnegative(),
});
export type Conversation = z.infer<typeof conversationSchema>;

/** The label to show for a conversation in a list. */
export function conversationLabel(c: Conversation): string {
  if (c.isGroup) return c.title ?? c.members.map((m) => m.displayName).join(", ");
  return c.otherMember?.displayName ?? "Conversation";
}
