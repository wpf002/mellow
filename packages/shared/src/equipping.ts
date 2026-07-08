import { z } from "zod";
import { prayerAuthorSchema } from "./prayer.js";

// ---------------------------------------------------------------------------
// Equipping Center (Phase 8) — learning surface only. Creator payouts /
// monetization and content moderation stay deferred behind review. Courses are
// free; enrollment tracks derived progress only.
// ---------------------------------------------------------------------------

export const courseCategorySchema = z.enum([
  "DISCIPLESHIP",
  "BIBLE_STUDY",
  "THEOLOGY",
  "PRAYER",
  "LEADERSHIP",
  "EVANGELISM",
  "FAMILY",
  "OTHER",
]);
export type CourseCategory = z.infer<typeof courseCategorySchema>;

export const COURSE_CATEGORY_LABEL: Record<CourseCategory, string> = {
  DISCIPLESHIP: "Discipleship",
  BIBLE_STUDY: "Bible Study",
  THEOLOGY: "Theology",
  PRAYER: "Prayer",
  LEADERSHIP: "Leadership",
  EVANGELISM: "Evangelism",
  FAMILY: "Marriage & Family",
  OTHER: "Other",
};

export const createCourseSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  summary: z.string().trim().min(1, "Add a short summary").max(500),
  category: courseCategorySchema.default("OTHER"),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const createLessonSchema = z.object({
  title: z.string().trim().min(1, "Add a lesson title").max(120),
  body: z.string().trim().min(1, "Write the lesson").max(20000),
});
export type CreateLessonInput = z.infer<typeof createLessonSchema>;

/** Course card / list view — derived counts, viewer-relative flags. */
export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  category: courseCategorySchema,
  published: z.boolean(),
  createdAt: z.string(),
  author: prayerAuthorSchema,
  isAuthor: z.boolean(),
  lessonCount: z.number().int().nonnegative(),
  enrollmentCount: z.number().int().nonnegative(),
  viewerEnrolled: z.boolean(),
  // Derived progress for the viewer (0/0 when not enrolled or no lessons).
  progress: z.object({
    completed: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
});
export type Course = z.infer<typeof courseSchema>;

export const lessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number().int().positive(),
  body: z.string(),
  completed: z.boolean(), // by the viewer
});
export type Lesson = z.infer<typeof lessonSchema>;

/** Course detail — the card fields plus ordered lessons. */
export const courseDetailSchema = courseSchema.extend({
  lessons: z.array(lessonSchema),
});
export type CourseDetail = z.infer<typeof courseDetailSchema>;
