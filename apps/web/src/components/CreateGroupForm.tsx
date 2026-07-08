"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroupSchema, type Group } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input, Textarea } from "./ui";

export function CreateGroupForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createGroupSchema.safeParse({ name, description });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch("/groups", { method: "POST", body: JSON.stringify(parsed.data) });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not create the group. Please try again.");
      return;
    }
    const group = (await res.json()) as Group;
    router.push(`/groups/${group.id}`);
  }

  if (!open) {
    return (
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>Create</Button>
      </div>
    );
  }

  return (
    <Card className="mb-4 p-6">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Group name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dawn Intercessors" maxLength={60} />
        </Field>
        <Field label="Description" hint="Optional.">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={280} />
        </Field>
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
