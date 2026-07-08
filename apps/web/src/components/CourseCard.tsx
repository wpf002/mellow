import Link from "next/link";
import { COURSE_CATEGORY_LABEL, type Course } from "@mellow/shared";
import { Card } from "./ui";

export function CourseCard({ course }: { course: Course }) {
  const { completed, total } = course.progress;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Link href={`/equipping/${course.id}`}>
      <Card className="flex h-full flex-col p-5 transition hover:border-equipping/60">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-equipping-soft px-2.5 py-1 text-xs font-semibold text-equipping-ink">
            {COURSE_CATEGORY_LABEL[course.category]}
          </span>
          {!course.published && (
            <span className="rounded-full bg-black/10 px-2.5 py-1 text-xs font-semibold text-muted">
              Draft
            </span>
          )}
        </div>
        <h3 className="mt-2 font-semibold">{course.title}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink/90">{course.summary}</p>
        <p className="mt-3 text-xs text-muted">
          By {course.author.displayName} · {course.lessonCount} lesson
          {course.lessonCount === 1 ? "" : "s"} · {course.enrollmentCount} enrolled
        </p>
        {course.viewerEnrolled && total > 0 && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
              <div className="h-full rounded-full bg-equipping" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {completed}/{total} complete
            </p>
          </div>
        )}
      </Card>
    </Link>
  );
}
