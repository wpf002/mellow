import type { FastifyInstance } from "fastify";
import { Prisma, prisma } from "@mellow/db";
import { profileUpdateSchema } from "@mellow/shared";
import { requireUserId } from "../lib/session.js";
import { serializeUser } from "../lib/serialize.js";

export async function registerMeRoutes(app: FastifyInstance) {
  // Current user (gated).
  app.get("/me", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: "User not found" });

    const publicView = await serializeUser(user, userId);
    return { ...publicView, email: user.email, timezone: user.timezone };
  });

  // Update the current user's profile.
  app.patch("/me", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = profileUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const input = parsed.data;

    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (!current) return reply.code(404).send({ error: "User not found" });

    // Handle is immutable once set.
    if (input.handle !== undefined && current.handle && input.handle !== current.handle) {
      return reply.code(409).send({ error: "Handle cannot be changed once set" });
    }

    const data: Prisma.UserUpdateInput = {};
    if (input.handle !== undefined && !current.handle) data.handle = input.handle;
    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl === "" ? null : input.avatarUrl;
    if (input.timezone !== undefined) data.timezone = input.timezone;

    try {
      const updated = await prisma.user.update({ where: { id: userId }, data });
      return serializeUser(updated, userId);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return reply.code(409).send({ error: "That handle is already taken" });
      }
      throw e;
    }
  });
}
