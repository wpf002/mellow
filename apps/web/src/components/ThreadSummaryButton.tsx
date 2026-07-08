"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui";

/** Prayer Companion thread summary (read-only, on demand). */
export function ThreadSummaryButton({ prayerId }: { prayerId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function summarize() {
    if (busy) return;
    setError(null);
    setBusy(true);
    const res = await apiFetch(`/prayers/${prayerId}/summary`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError("The Companion could not respond. Try again.");
      return;
    }
    const data = (await res.json()) as { summary: string };
    setSummary(data.summary);
  }

  return (
    <div>
      {summary ? (
        <div className="rounded-xl border border-equipping/50 bg-equipping-soft/30 p-4">
          <p className="text-xs font-semibold">✨ Companion summary</p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{summary}</p>
        </div>
      ) : (
        <Button type="button" variant="ghost" onClick={summarize} disabled={busy} className="text-sm">
          {busy ? "Summarizing…" : "✨ Summarize this thread"}
        </Button>
      )}
      {error && <p className="mt-1 text-sm text-brand">{error}</p>}
    </div>
  );
}
