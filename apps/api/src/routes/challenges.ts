import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, type Challenge as ChallengeRow } from "@mellow/db";
import { createChallengeSchema, type Challenge } from "@mellow/shared";
import { getUserId, requireUserId } from "../lib/session.js";
import { daysInWindow, dbDateToDayString } from "../lib/streak.js";

const idParams = z.object({ id: z.string().min(1) });

/**
 * Serialize challenges with derived participation + the viewer's progress. A
 * viewer's progress is the number of their prayer-days that fall inside the
 * challenge window — reusing PrayerDayMark events, computed here, never stored.
 */
async function serializeChallenges(
  challenges: ChallengeRow[],
  viewerId: string | null,
): Promise<Challenge[]> {
  const ids = challenges.map((c) => c.id);
  if (ids.length === 0) return [];

  const [counts, joined, marks] = await Promise.all([
    prisma.challengeParticipation.groupBy({
      by: ["challengeId"],
      where: { challengeId: { in: ids } },
      _count: { _all: true },
    }),
    viewerId
      ? prisma.challengeParticipation.findMany({
          where: { challengeId: { in: ids }, userId: viewerId },
          select: { challengeId: true },
        })
      : Promise.resolve([] as { challengeId: string }[]),
    viewerId
      ? prisma.prayerDayMark.findMany({ where: { userId: viewerId }, select: { date: true } })
      : Promise.resolve([] as { date: Date }[]),
  ]);

  const countByChallenge = new Map(counts.map((c) => [c.challengeId, c._count._all]));
  const joinedSet = new Set(joined.map((j) => j.challengeId));
  const markedDays = marks.map((m) => dbDateToDayString(m.date));

  return challenges.map((c) => {
    const startYmd = dbDateToDayString(c.startDate);
    const endYmd = dbDateToDayString(c.endDate);
    const marked = markedDays.filter((d) => d >= startYmd && d <= endYmd).length;
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      startDate: startYmd,
      endDate: endYmd,
      participantCount: countByChallenge.get(c.id) ?? 0,
      viewerJoined: joinedSet.has(c.id),
      progress: { marked, target: daysInWindow(startYmd, endYmd) },
    };
  });
}

export async function registerChallengeRoutes(app: FastifyInstance) {
  // List challenges (soonest-ending first) with the viewer's progress.
  app.get("/challenges", async (request) => {
    const viewerId = await getUserId(request);
    const rows = await prisma.challenge.findMany({ orderBy: [{ endDate: "asc" }, { id: "asc" }] });
    return { items: await serializeChallenges(rows, viewerId) };
  });

  // Create a community challenge.
  app.post("/challenges", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = createChallengeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { title, description, startDate, endDate } = parsed.data;

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description: description && description.length > 0 ? description : null,
        startDate: new Date(`${startDate}T00:00:00.000Z`),
        endDate: new Date(`${endDate}T00:00:00.000Z`),
      },
    });
    return reply.code(201).send((await serializeChallenges([challenge], userId))[0]);
  });

  // Join a challenge.
  app.post("/challenges/:id/join", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const challenge = await prisma.challenge.findUnique({ where: { id: parsed.data.id } });
    if (!challenge) return reply.code(404).send({ error: "Challenge not found" });

    await prisma.challengeParticipation.upsert({
      where: { challengeId_userId: { challengeId: challenge.id, userId } },
      create: { challengeId: challenge.id, userId },
      update: {},
    });
    return (await serializeChallenges([challenge], userId))[0];
  });
}
