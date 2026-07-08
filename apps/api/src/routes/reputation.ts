import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@mellow/db";
import { handleSchema } from "@mellow/shared";
import {
  ACHIEVEMENTS,
  computeReputation,
  evaluateAchievements,
  tallyEvents,
} from "../lib/reputation.js";

const handleParams = z.object({ handle: handleSchema });

export async function registerReputationRoutes(app: FastifyInstance) {
  // Derived reputation score + per-category breakdown. Public (it's a profile
  // surface); points are off-chain with no monetary value.
  app.get("/users/:handle/reputation", async (request, reply) => {
    const parsed = handleParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid handle" });

    const user = await prisma.user.findUnique({ where: { handle: parsed.data.handle } });
    if (!user) return reply.code(404).send({ error: "User not found" });

    const tally = await tallyEvents(user.id);
    return computeReputation(tally);
  });

  // Achievements: the full catalog with earned/unearned state. Evaluation runs
  // lazily here (pure badge engine over the tally; awards are idempotent).
  app.get("/users/:handle/achievements", async (request, reply) => {
    const parsed = handleParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid handle" });

    const user = await prisma.user.findUnique({ where: { handle: parsed.data.handle } });
    if (!user) return reply.code(404).send({ error: "User not found" });

    const tally = await tallyEvents(user.id);
    await evaluateAchievements(user.id, tally);

    const awards = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
    });
    const awardedByCode = new Map(awards.map((a) => [a.achievement.code, a.awardedAt]));

    return {
      items: ACHIEVEMENTS.map((a) => ({
        code: a.code,
        title: a.title,
        description: a.description,
        awardedAt: awardedByCode.get(a.code)?.toISOString() ?? null,
      })),
    };
  });
}
