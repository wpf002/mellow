"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChallengeSchema } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input, Textarea } from "./ui";

export function CreateChallengeForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createChallengeSchema.safeParse({ title, description, startDate, endDate });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch("/challenges", { method: "POST", body: JSON.stringify(parsed.data) });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not create the challenge. Please try again.");
      return;
    }
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  if (!open) {
    return (
      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={() => setOpen(true)}>
          New challenge
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-4 p-6">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
        </Field>
        <Field label="Description" hint="Optional.">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} />
        </Field>
        <div className="flex gap-3">
          <Field label="Start date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="End date">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        {error && <p className="text-sm text-brand">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
