"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Post, ReactionSummary, ReactionType } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { cn } from "./ui";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "AMEN", emoji: "✝️", label: "Amen" },
  { type: "PRAISE", emoji: "🙌", label: "Praise" },
  { type: "PRAYING", emoji: "🙏", label: "Praying" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
];

export function ReactionBar({
  postId,
  initial,
  disabled,
}: {
  postId: string;
  initial: ReactionSummary;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function react(type: ReactionType) {
    if (busy || disabled) return;
    setBusy(true);
    const remove = summary.viewerReaction === type;
    const res = await apiFetch(`/posts/${postId}/react`, {
      method: remove ? "DELETE" : "POST",
      ...(remove ? {} : { body: JSON.stringify({ type }) }),
    });
    setBusy(false);
    if (!res.ok) return;
    const updated = (await res.json()) as Post;
    setSummary(updated.reactions);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map((r) => {
        const count = summary.counts[r.type];
        const active = summary.viewerReaction === r.type;
        return (
          <button
            key={r.type}
            type="button"
            onClick={() => react(r.type)}
            disabled={busy || disabled}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition disabled:opacity-60",
              active
                ? "border-fellowship bg-fellowship-soft/60 font-semibold text-fellowship"
                : "border-line text-muted hover:border-fellowship/50",
            )}
          >
            <span aria-hidden>{r.emoji}</span>
            <span className="text-xs">{r.label}</span>
            {count > 0 && <span className="tabular-nums text-xs">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
