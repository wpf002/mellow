import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, type User } from "@mellow/db";
import {
  createMessageSchema,
  cursorQuerySchema,
  startConversationSchema,
  startGroupSchema,
} from "@mellow/shared";
import { requireUserId } from "../lib/session.js";

const idParams = z.object({ id: z.string().min(1) });

function toAuthor(user: User) {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName ?? user.name,
    avatarUrl: user.avatarUrl ?? user.image,
  };
}

/** Load a conversation the viewer belongs to, or null. */
async function findMemberConversation(conversationId: string, viewerId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: viewerId } },
  });
  if (!membership) return null;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { members: { include: { user: true } } },
  });
  return conversation ? { conversation, membership } : null;
}

export async function registerMessageRoutes(app: FastifyInstance) {
  // The viewer's conversations, most-recently-active first.
  app.get("/conversations", async (request, reply) => {
    const viewerId = await requireUserId(request, reply);
    if (!viewerId) return;

    const memberships = await prisma.conversationMember.findMany({
      where: { userId: viewerId },
      include: {
        conversation: { include: { members: { include: { user: true } } } },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    const items = await Promise.all(
      memberships.map(async (m) => {
        const other = m.conversation.members.find((mem) => mem.userId !== viewerId);
        const [lastMessage, unreadCount] = await Promise.all([
          prisma.message.findFirst({
            where: { conversationId: m.conversationId },
            orderBy: { createdAt: "desc" },
          }),
          prisma.message.count({
            where: {
              conversationId: m.conversationId,
              senderId: { not: viewerId },
              createdAt: { gt: m.lastReadAt },
            },
          }),
        ]);
        return {
          id: m.conversationId,
          isGroup: m.conversation.isGroup,
          title: m.conversation.title,
          members: m.conversation.members.map((mem) => toAuthor(mem.user)),
          updatedAt: m.conversation.updatedAt.toISOString(),
          otherMember: other ? toAuthor(other.user) : null,
          lastMessage: lastMessage
            ? {
                body: lastMessage.body,
                createdAt: lastMessage.createdAt.toISOString(),
                mine: lastMessage.senderId === viewerId,
              }
            : null,
          unreadCount,
        };
      }),
    );

    return { items };
  });

  // Start (or reuse) a 1:1 conversation with a user by handle.
  app.post("/conversations", async (request, reply) => {
    const viewerId = await requireUserId(request, reply);
    if (!viewerId) return;

    const parsed = startConversationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const target = await prisma.user.findUnique({ where: { handle: parsed.data.handle } });
    if (!target) return reply.code(404).send({ error: "User not found" });
    if (target.id === viewerId) {
      return reply.code(400).send({ error: "You cannot message yourself" });
    }

    // Reuse an existing 1:1 (non-group) that contains both users.
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: viewerId } } },
          { members: { some: { userId: target.id } } },
        ],
      },
    });

    const conversation =
      existing ??
      (await prisma.conversation.create({
        data: {
          members: { create: [{ userId: viewerId }, { userId: target.id }] },
        },
      }));

    return reply.code(existing ? 200 : 201).send({ id: conversation.id });
  });

  // Start a group conversation with several members by handle.
  app.post("/conversations/group", async (request, reply) => {
    const viewerId = await requireUserId(request, reply);
    if (!viewerId) return;

    const parsed = startGroupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    // Resolve handles → users; drop the creator if they listed themselves.
    const handles = [...new Set(parsed.data.handles)];
    const users = await prisma.user.findMany({ where: { handle: { in: handles } } });
    if (users.length !== handles.length) {
      return reply.code(404).send({ error: "One or more members not found" });
    }
    const memberIds = [...new Set([viewerId, ...users.map((u) => u.id)])];
    if (memberIds.length < 3) {
      return reply.code(400).send({ error: "A group needs at least two other members" });
    }

    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        title: parsed.data.title,
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
    });
    return reply.code(201).send({ id: conversation.id });
  });

  // Messages in a conversation (latest window, ascending), member-gated.
  app.get("/conversations/:id/messages", async (request, reply) => {
    const viewerId = await requireUserId(request, reply);
    if (!viewerId) return;
    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedQuery = cursorQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) return reply.code(400).send({ error: "Invalid query" });

    const found = await findMemberConversation(parsedParams.data.id, viewerId);
    if (!found) return reply.code(404).send({ error: "Conversation not found" });

    const other = found.conversation.members.find((m) => m.userId !== viewerId);
    // Newest `limit` messages, returned oldest-first for display.
    const rows = await prisma.message.findMany({
      where: { conversationId: parsedParams.data.id },
      include: { sender: true },
      orderBy: { createdAt: "desc" },
      take: parsedQuery.data.limit,
    });
    const items = rows
      .reverse()
      .map((mmsg) => ({
        id: mmsg.id,
        body: mmsg.body,
        createdAt: mmsg.createdAt.toISOString(),
        senderId: mmsg.senderId,
        sender: toAuthor(mmsg.sender),
        mine: mmsg.senderId === viewerId,
      }));

    return {
      isGroup: found.conversation.isGroup,
      title: found.conversation.title,
      members: found.conversation.members.map((m) => toAuthor(m.user)),
      otherMember: other ? toAuthor(other.user) : null,
      items,
    };
  });

  // Send a message.
  app.post("/conversations/:id/messages", async (request, reply) => {
    const viewerId = await requireUserId(request, reply);
    if (!viewerId) return;
    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedBody = createMessageSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsedBody.error.flatten() });
    }

    const found = await findMemberConversation(parsedParams.data.id, viewerId);
    if (!found) return reply.code(404).send({ error: "Conversation not found" });

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId: parsedParams.data.id, senderId: viewerId, body: parsedBody.data.body },
        include: { sender: true },
      });
      // Bump activity for list ordering; sender has implicitly read their own.
      await tx.conversation.update({
        where: { id: parsedParams.data.id },
        data: { updatedAt: new Date() },
      });
      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId: parsedParams.data.id, userId: viewerId } },
        data: { lastReadAt: new Date() },
      });
      return created;
    });

    return reply.code(201).send({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      senderId: message.senderId,
      sender: toAuthor(message.sender),
      mine: true,
    });
  });

  // Mark the conversation read up to now.
  app.post("/conversations/:id/read", async (request, reply) => {
    const viewerId = await requireUserId(request, reply);
    if (!viewerId) return;
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: parsed.data.id, userId: viewerId } },
    });
    if (!membership) return reply.code(404).send({ error: "Conversation not found" });

    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId: parsed.data.id, userId: viewerId } },
      data: { lastReadAt: new Date() },
    });
    return { ok: true };
  });
}
