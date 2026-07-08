import type { FastifyInstance } from "fastify";
import { prisma } from "@mellow/db";
import type { Streak } from "@mellow/shared";
import { requireUserId } from "../lib/session.js";
import { computeStreak, dbDateToDayString, localDayString } from "../lib/streak.js";
import { emitReputation } from "../lib/reputation.js";

/** Build the viewer's streak view from their PrayerDayMark events. */
async function loadStreak(userId: string, timezone: string): Promise<Streak> {
  const marks = await prisma.prayerDayMark.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    select: { date: true },
  });
  const markedDates = marks.map((m) => dbDateToDayString(m.date));
  const today = localDayString(new Date(), timezone);
  const { current, longest, todayMarked } = computeStreak(markedDates, today);
  return { current, longest, todayMarked, markedDates };
}

export async function registerPrayerLifeRoutes(app: FastifyInstance) {
  // Mark today (in the user's timezone) as a prayer day. Idempotent per day.
  app.post("/prayer-life/mark", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: "User not found" });

    const today = localDayString(new Date(), user.timezone);
    const date = new Date(`${today}T00:00:00.000Z`);
    const existing = await prisma.prayerDayMark.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!existing) {
      await prisma.prayerDayMark.create({ data: { userId, date } });
      await emitReputation(userId, "FAITHFULNESS", today); // once per local day
    }

    return loadStreak(userId, user.timezone);
  });

  // Current streak view.
  app.get("/prayer-life/streak", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: "User not found" });

    return loadStreak(userId, user.timezone);
  });
}
