"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { JOB_TYPE_LABEL, createJobSchema, type Job, type JobType } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input, Textarea } from "./ui";

export function JobComposer() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [orgName, setOrgName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [compensation, setCompensation] = useState("");
  const [type, setType] = useState<JobType>("FULL_TIME");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createJobSchema.safeParse({
      title,
      orgName,
      description,
      location,
      remote,
      compensation,
      type,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch("/jobs", { method: "POST", body: JSON.stringify(parsed.data) });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not post the opening. Please try again.");
      return;
    }
    const job = (await res.json()) as Job;
    router.push(`/calling/${job.id}`);
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Worship leader, Youth pastor, Frontend engineer" maxLength={120} />
        </Field>
        <Field label="Church / organization" hint="Optional — leave blank if you're posting as yourself.">
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={5000} placeholder="What's the calling, who are you looking for, and how should they reach out?" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as JobType)}
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-calling"
            >
              {(Object.keys(JOB_TYPE_LABEL) as JobType[]).map((t) => (
                <option key={t} value={t}>
                  {JOB_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location" hint="Leave blank if remote.">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} />
          </Field>
        </div>
        <Field label="Compensation" hint="Optional — e.g. “$50–70k”, “Volunteer”, or “Stipend”.">
          <Input value={compensation} onChange={(e) => setCompensation(e.target.value)} maxLength={120} placeholder="Volunteer / stipend / salary range" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
          Remote-friendly
        </label>

        {error && <p className="text-sm text-brand">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} className="bg-calling hover:brightness-95">
            {submitting ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
