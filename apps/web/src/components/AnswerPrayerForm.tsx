"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { answerPrayerSchema } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Textarea } from "./ui";

/** Author-only: mark a prayer answered by sharing a testimonial. */
export function AnswerPrayerForm({ prayerId }: { prayerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = answerPrayerSchema.safeParse({ body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch(`/prayers/${prayerId}/answer`, {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not mark this answered. Please try again.");
      return;
    }
    setBody("");
    startTransition(() => router.refresh());
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        ✓ Mark as answered
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm font-semibold text-calling">Share how this prayer was answered</p>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Give thanks and tell the story of how God answered…"
        rows={4}
        maxLength={2000}
        autoFocus
      />
      {error && <p className="text-sm text-brand">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Post testimony"}
        </Button>
      </div>
    </form>
  );
}
