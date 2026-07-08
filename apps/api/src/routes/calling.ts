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
    type: job.type,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    poster: toAuthor(job.poster),
    isPoster: viewerId === job.posterId,
  };
}

function serializeTalent(profile: TalentProfile & { user: User }, viewerId: string | null): Talent {
  return {
    headline: profile.headline,
    about: profile.about,
    skills: profile.skills,
    availability: profile.availability,
    visible: profile.visible,
    updatedAt: profile.updatedAt.toISOString(),
    user: toAuthor(profile.user),
    isViewer: viewerId === profile.userId,
  };
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
    const { title, orgName, description, location, remote, type } = parsed.data;

    const job = await prisma.jobListing.create({
      data: {
        posterId: userId,
        title,
        orgName: orgName && orgName.length > 0 ? orgName : null,
        description,
        location: location && location.length > 0 ? location : null,
        remote,
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
    return serializeTalent(profile, userId);
  });

  // The viewer's own entry (for prefilling the editor), or null.
  app.get("/talent/me", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const profile = await prisma.talentProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    return profile ? serializeTalent(profile, userId) : { profile: null };
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
      items: page.map((p) => serializeTalent(p, viewerId)),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  });
}
