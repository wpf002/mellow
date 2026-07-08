"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COURSE_CATEGORY_LABEL, createLessonSchema, type CourseDetail } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input, Textarea, cn } from "./ui";

export function CourseView({ initial, signedIn }: { initial: CourseDetail; signedIn: boolean }) {
  const router = useRouter();
  const [course, setCourse] = useState(initial);
  const [openLesson, setOpenLesson] = useState<string | null>(initial.lessons[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const { completed, total } = course.progress;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function mutate(path: string, body?: unknown) {
    if (busy) return;
    setBusy(true);
    const res = await apiFetch(path, {
      method: "POST",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    setBusy(false);
    if (!res.ok) return;
    setCourse((await res.json()) as CourseDetail);
    startTransition(() => router.refresh());
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/equipping" className="text-sm text-muted hover:underline">
        ← All Courses
      </Link>

      <Card className="mt-2 p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-equipping-soft px-2.5 py-1 text-xs font-semibold text-equipping-ink">
            {COURSE_CATEGORY_LABEL[course.category]}
          </span>
          {!course.published && (
            <span className="rounded-full bg-black/10 px-2.5 py-1 text-xs font-semibold text-muted">
              Draft — only you can see this
            </span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold">{course.title}</h1>
        <p className="mt-2 text-sm text-ink/90">{course.summary}</p>
        <p className="mt-3 text-xs text-muted">
          By {course.author.displayName} · {course.lessonCount} lesson
          {course.lessonCount === 1 ? "" : "s"} · {course.enrollmentCount} enrolled
        </p>

        {/* Enrollment / progress */}
        <div className="mt-5 border-t border-line pt-4">
          {course.viewerEnrolled ? (
            <div>
              <div className="flex justify-between text-xs text-muted">
                <span>Your progress</span>
                <span className="tabular-nums">
                  {completed}/{total} lessons
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/[0.06]">
                <div className="h-full rounded-full bg-equipping" style={{ width: `${pct}%` }} />
              </div>
              {total > 0 && completed === total && (
                <p className="mt-2 text-sm font-semibold text-equipping-ink">✓ Course complete — well done!</p>
              )}
            </div>
          ) : course.isAuthor ? null : signedIn ? (
            <Button
              onClick={() => mutate(`/courses/${course.id}/enroll`)}
              disabled={busy || course.lessonCount === 0}
              className="bg-equipping hover:brightness-95"
            >
              {course.lessonCount === 0 ? "No lessons yet" : "Enroll"}
            </Button>
          ) : (
            <Link href="/sign-in">
              <Button variant="outline">Login</Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Author controls */}
      {course.isAuthor && (
        <Card className="mt-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Teaching Tools</h2>
              <p className="text-xs text-muted">
                {course.published ? "Published to the catalog." : "Draft — publish when ready."}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => mutate(`/courses/${course.id}/publish`, { published: !course.published })}
              disabled={busy || (!course.published && course.lessonCount === 0)}
            >
              {course.published ? "Unpublish" : "Publish"}
            </Button>
          </div>
          <AddLesson courseId={course.id} onDone={setCourse} />
        </Card>
      )}

      {/* Lessons */}
      <div className="mt-6">
        <h2 className="mb-3 px-1 text-sm font-semibold text-muted">
          {course.lessons.length} {course.lessons.length === 1 ? "Lesson" : "Lessons"}
        </h2>
        {course.lessons.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted">
            No lessons yet{course.isAuthor ? " — add the first one above." : "."}
          </Card>
        ) : (
          <div className="space-y-2">
            {course.lessons.map((lesson) => {
              const isOpen = openLesson === lesson.id;
              return (
                <Card key={lesson.id} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenLesson(isOpen ? null : lesson.id)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        lesson.completed ? "bg-equipping text-white" : "bg-black/5 text-muted",
                      )}
                    >
                      {lesson.completed ? "✓" : lesson.order}
                    </span>
                    <span className="flex-1 font-medium">{lesson.title}</span>
                    <span className="text-muted">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-line p-4">
                      <p className="text-sm whitespace-pre-wrap text-ink/90">{lesson.body}</p>
                      {course.viewerEnrolled && (
                        <div className="mt-4">
                          <Button
                            variant={lesson.completed ? "outline" : "primary"}
                            onClick={() => mutate(`/lessons/${lesson.id}/complete`)}
                            disabled={busy || lesson.completed}
                            className={lesson.completed ? "" : "bg-equipping hover:brightness-95"}
                          >
                            {lesson.completed ? "Completed" : "Complete"}
                          </Button>
                        </div>
                      )}
                      {!course.viewerEnrolled && !course.isAuthor && signedIn && (
                        <p className="mt-3 text-xs text-muted">Enroll to track your progress.</p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Author-only inline lesson composer. */
function AddLesson({
  courseId,
  onDone,
}: {
  courseId: string;
  onDone: (course: CourseDetail) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createLessonSchema.safeParse({ title, body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch(`/courses/${courseId}/lessons`, {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not add the lesson. Please try again.");
      return;
    }
    onDone((await res.json()) as CourseDetail);
    setTitle("");
    setBody("");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  if (!open) {
    return (
      <div className="mt-4">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Add a lesson
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-line pt-4">
      <Field label="Lesson title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </Field>
      <Field label="Lesson content">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={20000} />
      </Field>
      {error && <p className="text-sm text-brand">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="bg-equipping hover:brightness-95">
          {submitting ? "Adding…" : "Add"}
        </Button>
      </div>
    </form>
  );
}
