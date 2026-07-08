"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { COURSE_CATEGORY_LABEL, createCourseSchema, type Course, type CourseCategory } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input, Textarea } from "./ui";

export function CourseComposer() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<CourseCategory>("DISCIPLESHIP");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createCourseSchema.safeParse({ title, summary, category });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch("/courses", { method: "POST", body: JSON.stringify(parsed.data) });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not create the course. Please try again.");
      return;
    }
    const course = (await res.json()) as Course;
    router.push(`/equipping/${course.id}`);
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Course title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Foundations of Prayer" maxLength={120} />
        </Field>
        <Field label="Summary" hint="A sentence or two on what learners will gain.">
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} maxLength={500} />
        </Field>
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CourseCategory)}
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-equipping"
          >
            {(Object.keys(COURSE_CATEGORY_LABEL) as CourseCategory[]).map((c) => (
              <option key={c} value={c}>
                {COURSE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="text-sm text-brand">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} className="bg-equipping hover:brightness-95">
            {submitting ? "Creating…" : "Create course"}
          </Button>
        </div>
        <p className="text-xs text-muted">
          Your course starts as a private draft. Add lessons, then publish it to the catalog.
        </p>
      </form>
    </Card>
  );
}
