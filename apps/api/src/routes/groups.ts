import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma, prisma, type PrayerGroup, type User } from "@mellow/db";
import {
  createGroupPrayerSchema,
  createGroupSchema,
  cursorQuerySchema,
  type Group,
} from "@mellow/shared";
import { getUserId, requireUserId } from "../lib/session.js";
import { serializePrayer, serializePrayers } from "../lib/serializePrayer.js";
import { emitReputation } from "../lib/reputation.js";

const idParams = z.object({ id: z.string().min(1) });
const prayerInclude = { author: true, testimonial: true, group: true } as const;

type GroupWithOwner = PrayerGroup & { owner: User };

/** Serialize groups with derived member counts + the viewer's role (batched). */
async function serializeGroups(groups: GroupWithOwner[], viewerId: string | null): Promise<Group[]> {
  const ids = groups.map((g) => g.id);
  if (ids.length === 0) return [];

  const [counts, roles] = await Promise.all([
    prisma.groupMember.groupBy({
      by: ["groupId"],
      where: { groupId: { in: ids } },
      _count: { _all: true },
    }),
    viewerId
      ? prisma.groupMember.findMany({
          where: { groupId: { in: ids }, userId: viewerId },
          select: { groupId: true, role: true },
        })
      : Promise.resolve([] as { groupId: string; role: "OWNER" | "ADMIN" | "MEMBER" }[]),
  ]);

  const countByGroup = new Map(counts.map((c) => [c.groupId, c._count._all]));
  const roleByGroup = new Map(roles.map((r) => [r.groupId, r.role]));

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    createdAt: g.createdAt.toISOString(),
    owner: {
      id: g.owner.id,
      handle: g.owner.handle,
      displayName: g.owner.displayName ?? g.owner.name,
      avatarUrl: g.owner.avatarUrl ?? g.owner.image,
    },
    memberCount: countByGroup.get(g.id) ?? 0,
    viewerRole: roleByGroup.get(g.id) ?? null,
  }));
}

async function serializeGroup(group: GroupWithOwner, viewerId: string | null): Promise<Group> {
  const [one] = await serializeGroups([group], viewerId);
  return one!;
}

export async function registerGroupRoutes(app: FastifyInstance) {
  // Create a group; the creator becomes its OWNER member.
  app.post("/groups", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = createGroupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { name, description } = parsed.data;

    const group = await prisma.prayerGroup.create({
      data: {
        name,
        description: description && description.length > 0 ? description : null,
        ownerId: userId,
        members: { create: { userId, role: "OWNER" } },
      },
      include: { owner: true },
    });
    await emitReputation(userId, "COMMUNITY", group.id);
    return reply.code(201).send(await serializeGroup(group, userId));
  });

  // List groups (discovery), cursor-paginated.
  app.get("/groups", async (request, reply) => {
    const parsed = cursorQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    const { cursor, limit } = parsed.data;

    const viewerId = await getUserId(request);
    const rows = await prisma.prayerGroup.findMany({
      include: { owner: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: await serializeGroups(page, viewerId),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  });

  // Group detail (public meta; the feed is member-gated separately).
  app.get("/groups/:id", async (request, reply) => {
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const viewerId = await getUserId(request);
    const group = await prisma.prayerGroup.findUnique({
      where: { id: parsed.data.id },
      include: { owner: true },
    });
    if (!group) return reply.code(404).send({ error: "Group not found" });
    return serializeGroup(group, viewerId);
  });

  // Join a group.
  app.post("/groups/:id/join", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const group = await prisma.prayerGroup.findUnique({
      where: { id: parsed.data.id },
      include: { owner: true },
    });
    if (!group) return reply.code(404).send({ error: "Group not found" });

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (!existing) {
      await prisma.groupMember.create({ data: { groupId: group.id, userId, role: "MEMBER" } });
      await emitReputation(userId, "COMMUNITY", group.id); // only on an actual join, not idempotent re-joins
    }
    return serializeGroup(group, userId);
  });

  // Leave a group. The owner cannot leave their own group.
  app.post("/groups/:id/leave", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const group = await prisma.prayerGroup.findUnique({
      where: { id: parsed.data.id },
      include: { owner: true },
    });
    if (!group) return reply.code(404).send({ error: "Group not found" });
    if (group.ownerId === userId) {
      return reply.code(400).send({ error: "The owner cannot leave their own group" });
    }

    await prisma.groupMember.deleteMany({ where: { groupId: group.id, userId } });
    return serializeGroup(group, userId);
  });

  // Post a prayer into the group (members only). Visibility is forced to GROUP.
  app.post("/groups/:id/prayers", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedBody = createGroupPrayerSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsedBody.error.flatten() });
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: parsedParams.data.id, userId } },
    });
    if (!membership) return reply.code(403).send({ error: "Join the group to post a prayer" });

    const { title, body } = parsedBody.data;
    const prayer = await prisma.prayer.create({
      data: {
        authorId: userId,
        title: title && title.length > 0 ? title : null,
        body,
        visibility: "GROUP",
        groupId: parsedParams.data.id,
      },
      include: prayerInclude,
    });
    await emitReputation(userId, "PRAYER_POSTED", prayer.id);
    return reply.code(201).send(await serializePrayer(prayer, userId));
  });

  // Group prayer feed (members only), cursor-paginated.
  app.get("/groups/:id/prayers", async (request, reply) => {
    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedQuery = cursorQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) return reply.code(400).send({ error: "Invalid query" });
    const { cursor, limit } = parsedQuery.data;

    const viewerId = await requireUserId(request, reply);
    if (!viewerId) return;

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: parsedParams.data.id, userId: viewerId } },
    });
    if (!membership) return reply.code(403).send({ error: "Join the group to see its prayers" });

    const rows = await prisma.prayer.findMany({
      where: { groupId: parsedParams.data.id },
      include: prayerInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: await serializePrayers(page, viewerId),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  });
}
