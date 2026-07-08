import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@mellow/db";
import { aiEnabled, assistPrayer, summarizeThread } from "@mellow/ai";
import { requireUserId } from "../lib/session.js";

// ---------------------------------------------------------------------------
// Prayer Companion (Phase 6) — READ-ONLY. It suggests; it never posts. All
// endpoints are auth-gated and return 503 when the AI layer is disabled, so
// the app runs fully without a key (the web hides the UI via /companion/status).
// ---------------------------------------------------------------------------

const idParams = z.object({ id: z.string().min(1) });
const assistBody = z.object({
  draft: z.string().trim().min(1, "Write a draft first").max(2000),
});

export async function registerCompanionRoutes(app: FastifyInstance) {
  // Whether the AI layer is on — the web uses this to show/hide companion UI.
  app.get("/companion/status", async () => ({ enabled: aiEnabled() }));

  // Compose assist + scripture suggestions for a prayer draft.
  app.post("/companion/assist", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    if (!aiEnabled()) return reply.code(503).send({ error: "AI features are not enabled" });

    const parsed = assistBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    try {
      return await assistPrayer(parsed.data.draft);
    } catch (e) {
      request.log.error({ err: e }, "companion assist failed");
      return reply.code(502).send({ error: "The companion could not respond. Try again." });
    }
  });

  // Summarize a prayer thread the viewer can see.
  app.post("/prayers/:id/summary", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    if (!aiEnabled()) return reply.code(503).send({ error: "AI features are not enabled" });

    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    // Visibility: reuse the prayer-detail rule — author, PUBLIC, mutual-follow
    // FRIENDS, or group membership.
    const prayer = await prisma.prayer.findFirst({
      where: {
        AND: [
          { id: parsed.data.id },
          {
            OR: [
              { authorId: userId },
              { visibility: "PUBLIC" },
              {
                visibility: "FRIENDS",
                author: {
                  followers: { some: { followerId: userId } },
                  following: { some: { followingId: userId } },
                },
              },
              { visibility: "GROUP", group: { members: { some: { userId } } } },
            ],
          },
        ],
      },
      include: {
        testimonial: true,
        comments: { include: { author: true }, orderBy: { createdAt: "asc" }, take: 50 },
      },
    });
    if (!prayer) return reply.code(404).send({ error: "Prayer not found" });

    try {
      const summary = await summarizeThread({
        title: prayer.title,
        body: prayer.body,
        answered: prayer.status === "ANSWERED",
        testimonial: prayer.testimonial?.body ?? null,
        comments: prayer.comments.map((c) => ({
          author: c.author.displayName ?? c.author.name,
          body: c.body,
        })),
      });
      return { summary };
    } catch (e) {
      request.log.error({ err: e }, "companion summary failed");
      return reply.code(502).send({ error: "The companion could not respond. Try again." });
    }
  });
}
