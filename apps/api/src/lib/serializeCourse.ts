import { prisma, type Course as CourseRow, type Lesson as LessonRow, type User } from "@mellow/db";
import type { Course, CourseDetail } from "@mellow/shared";

type CourseWithAuthor = CourseRow & { author: User };

function toAuthor(user: User) {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName ?? user.name,
    avatarUrl: user.avatarUrl ?? user.image,
  };
}

/**
 * Serialize course cards with derived counts + the viewer's progress, batched
 * to avoid N+1. Progress = the viewer's completed lessons / total lessons —
 * never stored.
 */
export async function serializeCourses(
  courses: CourseWithAuthor[],
  viewerId: string | null,
): Promise<Course[]> {
  const ids = courses.map((c) => c.id);
  if (ids.length === 0) return [];

  const [lessons, enrollmentGroups, viewerEnrollments, viewerCompletions] = await Promise.all([
    prisma.lesson.findMany({ where: { courseId: { in: ids } }, select: { id: true, courseId: true } }),
    prisma.enrollment.groupBy({ by: ["courseId"], where: { courseId: { in: ids } }, _count: { _all: true } }),
    viewerId
      ? prisma.enrollment.findMany({ where: { courseId: { in: ids }, userId: viewerId }, select: { courseId: true } })
      : Promise.resolve([] as { courseId: string }[]),
    viewerId
      ? prisma.lessonCompletion.findMany({
          where: { userId: viewerId, lesson: { courseId: { in: ids } } },
          select: { lesson: { select: { courseId: true } } },
        })
      : Promise.resolve([] as { lesson: { courseId: string } }[]),
  ]);

  const lessonCount = new Map<string, number>();
  for (const l of lessons) lessonCount.set(l.courseId, (lessonCount.get(l.courseId) ?? 0) + 1);
  const enrollmentCount = new Map(enrollmentGroups.map((g) => [g.courseId, g._count._all]));
  const enrolled = new Set(viewerEnrollments.map((e) => e.courseId));
  const completedByCourse = new Map<string, number>();
  for (const c of viewerCompletions) {
    const cid = c.lesson.courseId;
    completedByCourse.set(cid, (completedByCourse.get(cid) ?? 0) + 1);
  }

  return courses.map((c) => {
    const total = lessonCount.get(c.id) ?? 0;
    const isEnrolled = enrolled.has(c.id);
    return {
      id: c.id,
      title: c.title,
      summary: c.summary,
      category: c.category,
      published: c.published,
      createdAt: c.createdAt.toISOString(),
      author: toAuthor(c.author),
      isAuthor: viewerId === c.authorId,
      lessonCount: total,
      enrollmentCount: enrollmentCount.get(c.id) ?? 0,
      viewerEnrolled: isEnrolled,
      progress: { completed: isEnrolled ? completedByCourse.get(c.id) ?? 0 : 0, total },
    };
  });
}

/** Course detail = the card fields plus ordered lessons with viewer completion. */
export async function serializeCourseDetail(
  course: CourseWithAuthor & { lessons: LessonRow[] },
  viewerId: string | null,
): Promise<CourseDetail> {
  const [summary] = await serializeCourses([course], viewerId);
  const completed = viewerId
    ? new Set(
        (
          await prisma.lessonCompletion.findMany({
            where: { userId: viewerId, lessonId: { in: course.lessons.map((l) => l.id) } },
            select: { lessonId: true },
          })
        ).map((r) => r.lessonId),
      )
    : new Set<string>();

  const lessons = [...course.lessons]
    .sort((a, b) => a.order - b.order)
    .map((l) => ({
      id: l.id,
      title: l.title,
      order: l.order,
      body: l.body,
      completed: completed.has(l.id),
    }));

  return { ...summary!, lessons };
}
