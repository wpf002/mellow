import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@mellow/db";
import {
  courseCategorySchema,
  createCourseSchema,
  createLessonSchema,
  cursorQuerySchema,
} from "@mellow/shared";
import { getUserId, requireUserId } from "../lib/session.js";
import { serializeCourseDetail, serializeCourses } from "../lib/serializeCourse.js";
import { notify } from "../lib/notifications.js";

// ---------------------------------------------------------------------------
// Equipping Center (Phase 8) — learning surface only. No creator payouts /
// monetization and no content moderation (deferred behind review). Courses are
// free; enrollment tracks derived progress.
// ---------------------------------------------------------------------------

const idParams = z.object({ id: z.string().min(1) });
const catalogQuery = cursorQuerySchema.extend({ category: courseCategorySchema.optional() });
const publishBody = z.object({ published: z.boolean().default(true) });

async function loadDetail(courseId: string, viewerId: string | null) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { author: true, lessons: true },
  });
  return course ? serializeCourseDetail(course, viewerId) : null;
}

export async function registerEquippingRoutes(app: FastifyInstance) {
  // Create a course (starts as an unpublished draft).
  app.post("/courses", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const parsed = createCourseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const course = await prisma.course.create({
      data: { authorId: userId, ...parsed.data },
      include: { author: true },
    });
    return reply.code(201).send((await serializeCourses([course], userId))[0]);
  });

  // Published catalog (cursor-paginated, optional ?category filter).
  app.get("/courses", async (request, reply) => {
    const parsed = catalogQuery.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    const { cursor, limit, category } = parsed.data;

    const viewerId = await getUserId(request);
    const rows = await prisma.course.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      include: { author: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: await serializeCourses(page, viewerId),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  });

  // The viewer's learning: courses they're enrolled in + courses they teach.
  app.get("/my/courses", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;

    const [enrolledRows, teachingRows] = await Promise.all([
      prisma.course.findMany({
        where: { enrollments: { some: { userId } } },
        include: { author: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.course.findMany({
        where: { authorId: userId },
        include: { author: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return {
      enrolled: await serializeCourses(enrolledRows, userId),
      teaching: await serializeCourses(teachingRows, userId),
    };
  });

  // Course detail. Drafts are visible only to their author.
  app.get("/courses/:id", async (request, reply) => {
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const viewerId = await getUserId(request);
    const detail = await loadDetail(parsed.data.id, viewerId);
    if (!detail) return reply.code(404).send({ error: "Course not found" });
    if (!detail.published && !detail.isAuthor) {
      return reply.code(404).send({ error: "Course not found" });
    }
    return detail;
  });

  // Publish / unpublish (author only).
  app.post("/courses/:id/publish", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedBody = publishBody.safeParse(request.body ?? {});
    if (!parsedBody.success) return reply.code(400).send({ error: "Invalid input" });

    const course = await prisma.course.findUnique({ where: { id: parsedParams.data.id } });
    if (!course) return reply.code(404).send({ error: "Course not found" });
    if (course.authorId !== userId) {
      return reply.code(403).send({ error: "Only the author can publish this course" });
    }

    await prisma.course.update({
      where: { id: course.id },
      data: { published: parsedBody.data.published },
    });
    return loadDetail(course.id, userId);
  });

  // Add a lesson (author only). Order is appended.
  app.post("/courses/:id/lessons", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const parsedParams = idParams.safeParse(request.params);
    if (!parsedParams.success) return reply.code(400).send({ error: "Invalid id" });
    const parsedBody = createLessonSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsedBody.error.flatten() });
    }

    const course = await prisma.course.findUnique({ where: { id: parsedParams.data.id } });
    if (!course) return reply.code(404).send({ error: "Course not found" });
    if (course.authorId !== userId) {
      return reply.code(403).send({ error: "Only the author can add lessons" });
    }

    const last = await prisma.lesson.findFirst({
      where: { courseId: course.id },
      orderBy: { order: "desc" },
    });
    await prisma.lesson.create({
      data: {
        courseId: course.id,
        title: parsedBody.data.title,
        body: parsedBody.data.body,
        order: (last?.order ?? 0) + 1,
      },
    });
    return loadDetail(course.id, userId);
  });

  // Enroll in a published course (idempotent).
  app.post("/courses/:id/enroll", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const course = await prisma.course.findUnique({ where: { id: parsed.data.id } });
    if (!course || !course.published) return reply.code(404).send({ error: "Course not found" });

    const existing = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: course.id, userId } },
    });
    if (!existing) {
      await prisma.enrollment.create({ data: { courseId: course.id, userId } });
      await notify(course.authorId, userId, "COURSE_ENROLLED", course.id); // first enroll only
    }
    return loadDetail(course.id, userId);
  });

  // Mark a lesson complete (must be enrolled; idempotent).
  app.post("/lessons/:id/complete", async (request, reply) => {
    const userId = await requireUserId(request, reply);
    if (!userId) return;
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid id" });

    const lesson = await prisma.lesson.findUnique({ where: { id: parsed.data.id } });
    if (!lesson) return reply.code(404).send({ error: "Lesson not found" });

    const enrollment = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: lesson.courseId, userId } },
    });
    if (!enrollment) return reply.code(403).send({ error: "Enroll in the course first" });

    await prisma.lessonCompletion.upsert({
      where: { lessonId_userId: { lessonId: lesson.id, userId } },
      create: { lessonId: lesson.id, userId },
      update: {},
    });
    return loadDetail(lesson.courseId, userId);
  });
}
