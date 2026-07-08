import type { FastifyInstance } from "fastify";
import { prisma } from "@mellow/db";
import { cursorQuerySchema } from "@mellow/shared";
import { requireUserId } from "../lib/session.js";

export async function registerNotificationRoutes(app: FastifyInstance) {
  // The viewer's notifications (newest first) + unread count.
  app.get("/notifications", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const parsed = cursorQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    const { cursor, limit } = parsed.data;

    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        include: { actor: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      unreadCount,
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
      items: page.map((n) => ({
        id: n.id,
        type: n.type,
        entityId: n.entityId,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        actor: {
          id: n.actor.id,
          handle: n.actor.handle,
          displayName: n.actor.displayName ?? n.actor.name,
          avatarUrl: n.actor.avatarUrl ?? n.actor.image,
        },
      })),
    };
  });

  // Lightweight unread count (for the nav badge).
  app.get("/notifications/unread-count", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const unreadCount = await prisma.notification.count({ where: { userId, read: false } });
    return { unreadCount };
  });

  // Mark all of the viewer's notifications read.
  app.post("/notifications/read", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { ok: true };
  });
}
