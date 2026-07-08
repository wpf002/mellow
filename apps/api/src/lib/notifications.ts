import { prisma, type NotificationType } from "@mellow/db";

/**
 * Create an in-app notification. Fire-and-forget from action routes (never
 * break the action). No-op when the actor is the recipient (don't notify your
 * own actions).
 */
export async function notify(
  recipientId: string,
  actorId: string,
  type: NotificationType,
  entityId?: string,
): Promise<void> {
  if (recipientId === actorId) return;
  try {
    await prisma.notification.create({ data: { userId: recipientId, actorId, type, entityId } });
  } catch (e) {
    console.error("notify failed", { recipientId, actorId, type, e });
  }
}
