"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroupPrayerSchema } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input, Textarea } from "./ui";

/** Post a prayer into a group (members only). */
export function GroupPrayerComposer({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createGroupPrayerSchema.safeParse({ title, body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch(`/groups/${groupId}/prayers`, {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not post your prayer. Please try again.");
      return;
    }
    setTitle("");
    setBody("");
    startTransition(() => router.refresh());
  }

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title" hint="Optional.">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Prayer request">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share a request with the group…"
            rows={3}
            maxLength={2000}
          />
        </Field>
        {error && <p className="text-sm text-brand">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
