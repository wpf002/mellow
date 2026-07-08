"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPostSchema, type PostVisibility } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Input, Textarea } from "./ui";

const visibilityOptions: { value: PostVisibility; label: string }[] = [
  { value: "PUBLIC", label: "Public" },
  { value: "FRIENDS", label: "Friends only" },
  { value: "PRIVATE", label: "Private" },
];

export function PostComposer() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createPostSchema.safeParse({ body, imageUrl, visibility });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch("/posts", { method: "POST", body: JSON.stringify(parsed.data) });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not post. Please try again.");
      return;
    }
    setBody("");
    setImageUrl("");
    startTransition(() => router.refresh());
  }

  return (
    <Card className="mb-4 p-5">
      <form onSubmit={submit} className="space-y-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share an encouragement, testimony, or thought with the fellowship…"
          rows={3}
          maxLength={2000}
        />
        {error && <p className="text-sm text-brand">{error}</p>}
        <div className="flex items-center justify-between">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PostVisibility)}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-fellowship"
          >
            {visibilityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-fellowship hover:brightness-95"
          >
            {submitting ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
