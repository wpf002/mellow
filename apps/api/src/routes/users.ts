import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@mellow/db";
import { handleSchema } from "@mellow/shared";
import { getUserId, requireUserId } from "../lib/session.js";
import { serializeUser } from "../lib/serialize.js";

const handleParams = z.object({ handle: handleSchema });

export async function registerUserRoutes(app: FastifyInstance) {
  // Public profile by handle.
  app.get("/users/:handle", async (request, reply) => {
    const parsed = handleParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid handle" });

    const user = await prisma.user.findUnique({ where: { handle: parsed.data.handle } });
    if (!user) return reply.code(404).send({ error: "User not found" });

    const viewerId = await getUserId(request);
    return serializeUser(user, viewerId);
  });

  // Follow a user.
  app.post("/users/:handle/follow", async (request, reply) => {
    const viewerId = await requireUserId(request, reply);
    if (!viewerId) return;

    const parsed = handleParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid handle" });

    const target = await prisma.user.findUnique({ where: { handle: parsed.data.handle } });
    if (!target) return reply.code(404).send({ error: "User not found" });
    if (target.id === viewerId) return reply.code(400).send({ error: "You cannot follow yourself" });

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: viewerId, followingId: target.id } },
      create: { followerId: viewerId, followingId: target.id },
      update: {},
    });
    return { following: true };
  });

  // Unfollow a user.
  app.delete("/users/:handle/follow", async (request, reply) => {
    const viewerId = await requireUserId(request, reply);
    if (!viewerId) return;

    const parsed = handleParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid handle" });

    const target = await prisma.user.findUnique({ where: { handle: parsed.data.handle } });
    if (!target) return reply.code(404).send({ error: "User not found" });

    await prisma.follow.deleteMany({
      where: { followerId: viewerId, followingId: target.id },
    });
    return { following: false };
  });
}
