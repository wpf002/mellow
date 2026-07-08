import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma, prisma } from "@mellow/db";
import { COURSE_CATEGORY_LABEL, JOB_TYPE_LABEL } from "@mellow/shared";
import { getUserId } from "../lib/session.js";

const query = z.object({ q: z.string().trim().min(1).max(100) });

/** Prayer visibility for search (mirrors routes/prayers.ts, non-group only). */
function prayerVisibility(viewerId: string | null): Prisma.PrayerWhereInput {
  if (!viewerId) return { visibility: "PUBLIC", groupId: null };
  return {
    groupId: null,
    OR: [
      { authorId: viewerId },
      { visibility: "PUBLIC" },
      {
        visibility: "FRIENDS",
        author: {
          followers: { some: { followerId: viewerId } },
          following: { some: { followingId: viewerId } },
        },
      },
    ],
  };
}

function postVisibility(viewerId: string | null): Prisma.PostWhereInput {
  if (!viewerId) return { visibility: "PUBLIC" };
  return {
    OR: [
      { authorId: viewerId },
      { visibility: "PUBLIC" },
      {
        visibility: "FRIENDS",
        author: {
          followers: { some: { followerId: viewerId } },
          following: { some: { followingId: viewerId } },
        },
      },
    ],
  };
}

export async function registerSearchRoutes(app: FastifyInstance) {
  // Global search across pillars. Prayers/posts respect visibility; courses are
  // published-only; people match handle/name. Each bucket capped at 8.
  app.get("/search", async (request, reply) => {
    const parsed = query.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Enter a search term" });
    const q = parsed.data.q;
    const contains = { contains: q, mode: "insensitive" as const };
    const viewerId = await getUserId(request);

    const [people, prayers, posts, jobs, courses] = await Promise.all([
      prisma.user.findMany({
        where: { handle: { not: null }, OR: [{ handle: contains }, { displayName: contains }, { name: contains }] },
        take: 8,
      }),
      prisma.prayer.findMany({
        where: { AND: [prayerVisibility(viewerId), { OR: [{ title: contains }, { body: contains }] }] },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.post.findMany({
        where: { AND: [postVisibility(viewerId), { body: contains }] },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.jobListing.findMany({
        where: { status: "OPEN", OR: [{ title: contains }, { orgName: contains }, { description: contains }] },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.course.findMany({
        where: { published: true, OR: [{ title: contains }, { summary: contains }] },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    return {
      query: q,
      people: people.map((u) => ({
        id: u.id,
        handle: u.handle,
        displayName: u.displayName ?? u.name,
        avatarUrl: u.avatarUrl ?? u.image,
      })),
      prayers: prayers.map((p) => ({
        id: p.id,
        title: p.title ?? p.body.slice(0, 60),
        subtitle: p.status === "ANSWERED" ? "Answered prayer" : "Prayer request",
      })),
      posts: posts.map((p) => ({ id: p.id, title: p.body.slice(0, 70), subtitle: "Fellowship post" })),
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        subtitle: `${JOB_TYPE_LABEL[j.type]} · ${j.orgName ?? "Calling"}`,
      })),
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: COURSE_CATEGORY_LABEL[c.category],
      })),
    };
  });
}
