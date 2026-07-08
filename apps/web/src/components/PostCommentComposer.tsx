"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPostCommentSchema } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Textarea } from "./ui";

export function PostCommentComposer({ postId }: { postId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createPostCommentSchema.safeParse({ body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not post your comment. Please try again.");
      return;
    }
    setBody("");
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a comment…"
        rows={3}
        maxLength={1000}
      />
      {error && <p className="text-sm text-brand">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} className="bg-fellowship hover:brightness-95">
          {submitting ? "Posting…" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
