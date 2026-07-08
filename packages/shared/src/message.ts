import { z } from "zod";
import { handleSchema } from "./user.js";
import { prayerAuthorSchema } from "./prayer.js";

// ---------------------------------------------------------------------------
// Messaging (Phase 4). 1:1 direct messages for the MVP; unread counts derived.
// ---------------------------------------------------------------------------

/** Start (or reuse) a 1:1 conversation with the given user. */
export const startConversationSchema = z.object({ handle: handleSchema });
export type StartConversationInput = z.infer<typeof startConversationSchema>;

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
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  updatedAt: z.string(),
  // The other participant (1:1). Null only in the degenerate self/empty case.
  otherMember: prayerAuthorSchema.nullable(),
  lastMessage: z
    .object({ body: z.string(), createdAt: z.string(), mine: z.boolean() })
    .nullable(),
  unreadCount: z.number().int().nonnegative(),
});
export type Conversation = z.infer<typeof conversationSchema>;
