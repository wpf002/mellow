import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, type JobListing, type TalentProfile, type User } from "@mellow/db";
import {
  createJobSchema,
  cursorQuerySchema,
  jobTypeSchema,
  upsertTalentSchema,
  type Job,
  type Talent,
} from "@mellow/shared";
import { getUserId, requireUserId } from "../lib/session.js";
import { WEIGHTS } from "../lib/reputation.js";

/** Derived reputation scores for a set of users (one groupBy, no N+1). */
async function reputationScores(userIds: string[]): Promise<Map<string, number>> {
  const scores = new Map<string, number>(userIds.map((id) => [id, 0]));
  if (userIds.length === 0) return scores;
  const groups = await prisma.reputationEvent.groupBy({
    by: ["userId", "category"],
    where: { userId: { in: userIds } },
    _count: { _all: true },
  });
  for (const g of groups) {
    scores.set(g.userId, (scores.get(g.userId) ?? 0) + g._count._all * WEIGHTS[g.category]);
  }
  return scores;
}

/** Which of `userIds` the viewer follows (empty when signed out). */
async function followedSet(viewerId: string | null, userIds: string[]): Promise<Set<string>> {
  if (!viewerId || userIds.length === 0) return new Set();
  const edges = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: userIds } },
    select: { followingId: true },
  });
  return new Set(edges.map((e) => e.followingId));
}

// ---------------------------------------------------------------------------
// Calling Center (Phase 7) — listings surface only. No transactions, fees,
// payouts, applications, or match AI (deferred behind review). Contact runs
// through the existing 1:1 messaging.
// ---------------------------------------------------------------------------

const idParams = z.object({ id: z.string().min(1) });
const jobListQuery = cursorQuerySchema.extend({ type: jobTypeSchema.optional() });

function toAuthor(user: User) {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName ?? user.name,
    avatarUrl: user.avatarUrl ?? user.image,
  };
}

function serializeJob(job: JobListing & { poster: User }, viewerId: string | null): Job {
  return {
    id: job.id,
    title: job.title,
    orgName: job.orgName,
    description: job.description,
    location: job.location,
    remote: job.remote,
    compensation: job.compensation,
    type: job.type,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    poster: toAuthor(job.poster),
    isPoster: viewerId === job.posterId,
  };
}

function serializeTalent(
  profile: TalentProfile & { user: User },
  viewerId: string | null,
  reputationScore = 0,
  isFollowedByViewer = false,
): Talent {
  return {
    headline: profile.headline,
    about: profile.about,
    skills: profile.skills,
    availability: profile.availability,
    visible: profile.visible,
    updatedAt: profile.updatedAt.toISOString(),
    user: toAuthor(profile.user),
    isViewer: viewerId === profile.userId,
    reputationScore,
    isFollowedByViewer,
  };
}

/** Serialize a page of talent entries with batched reputation + follow state. */
async function serializeTalents(
  profiles: (TalentProfile & { user: User })[],
  viewerId: string | null,
): Promise<Talent[]> {
  const userIds = profiles.map((p) => p.userId);
  const [scores, followed] = await Promise.all([
    reputationScores(userIds),
    followedSet(viewerId, userIds),
  ]);
  return profiles.map((p) =>
    serializeTalent(p, viewerId, scores.get(p.userId) ?? 0, followed.has(p.userId)),
  );
}

export async function registerCallingRoutes(app: FastifyInstance) {
  // Post an opening.
  app.post("/jobs", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = createJobSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { title, orgName, description, location, remote, compensation, type } = parsed.data;

    const job = await prisma.jobListing.create({
      data: {
        posterId: userId,
        title,
        orgName: orgName && orgName.length > 0 ? orgName : null,
        description,
        location: location && location.length > 0 ? location : null,
        remote,
        compensation: compensation && compensation.length > 0 ? compensation : null,
        type,
      },
      include: { poster: true },
    });
    return reply.code(201).send(serializeJob(job, userId));
  });

  // Browse OPEN listings (cursor-paginated, optional ?type= filter).
  app.get("/jobs", async (request, reply) => {
    const parsed = jobListQuery.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    const { cursor, limit, type } = parsed.data;

    const viewerId = await getUserId(request);
    const rows = await prisma.jobListing.findMany({
      where: { status: "OPEN", ...(type ? { type } : {}) },
      include: { poster: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: page.map((job) => serializeJob(job, viewerId)),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  });

  // Listing detail (closed listings stay visible by direct link).
  app.get("/jobs/:id", async (request, reply) => {
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const viewerId = await getUserId(request);
    const job = await prisma.jobListing.findUnique({
      where: { id: parsed.data.id },
      include: { poster: true },
    });
    if (!job) return reply.code(404).send({ error: "Listing not found" });
    return serializeJob(job, viewerId);
  });

  // Close a listing (poster only, idempotent).
  app.post("/jobs/:id/close", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const job = await prisma.jobListing.findUnique({ where: { id: parsed.data.id } });
    if (!job) return reply.code(404).send({ error: "Listing not found" });
    if (job.posterId !== userId) {
      return reply.code(403).send({ error: "Only the poster can close this listing" });
    }

    const updated = await prisma.jobListing.update({
      where: { id: job.id },
      data: { status: "CLOSED" },
      include: { poster: true },
    });
    return serializeJob(updated, userId);
  });

  // Create/update the viewer's talent-directory entry (opt-in).
  app.put("/talent", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = upsertTalentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { headline, about, skills, availability, visible } = parsed.data;
    const data = {
      headline,
      about: about && about.length > 0 ? about : null,
      skills,
      availability: availability && availability.length > 0 ? availability : null,
      visible,
    };

    const profile = await prisma.talentProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      include: { user: true },
    });
    return (await serializeTalents([profile], userId))[0];
  });

  // The viewer's own entry (for prefilling the editor), or null.
  app.get("/talent/me", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const profile = await prisma.talentProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    return profile ? (await serializeTalents([profile], userId))[0] : { profile: null };
  });

  // Talent directory (visible entries only, most recently updated first).
  app.get("/talent", async (request, reply) => {
    const parsed = cursorQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    const { cursor, limit } = parsed.data;

    const viewerId = await getUserId(request);
    const rows = await prisma.talentProfile.findMany({
      where: { visible: true },
      include: { user: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: await serializeTalents(page, viewerId),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  });
}
