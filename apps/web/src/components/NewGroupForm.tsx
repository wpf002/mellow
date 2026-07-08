"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { startGroupSchema } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input } from "./ui";

/** Start a group conversation from a title + comma-separated handles. */
export function NewGroupForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [handlesText, setHandlesText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const handles = handlesText
      .split(",")
      .map((h) => h.trim().replace(/^@/, ""))
      .filter(Boolean);
    const parsed = startGroupSchema.safeParse({ title, handles });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch("/conversations/group", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not start the group. Check the handles and try again.");
      return;
    }
    const { id } = (await res.json()) as { id: string };
    router.push(`/messages/${id}`);
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Group name">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tuesday Prayer Circle"
            maxLength={80}
          />
        </Field>
        <Field label="Members" hint="Comma-separated handles, at least two — e.g. sarah, mark.">
          <Input
            value={handlesText}
            onChange={(e) => setHandlesText(e.target.value)}
            placeholder="sarah, mark"
          />
        </Field>

        {error && <p className="text-sm text-brand">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} className="bg-fellowship hover:brightness-95">
            {submitting ? "Creating…" : "Start group"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
