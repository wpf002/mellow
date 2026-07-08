"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button, cn } from "./ui";

interface Assist {
  suggestion: string;
  scriptures: { reference: string; text: string; why: string }[];
}

/**
 * Prayer Companion assist panel (Phase 6). READ-ONLY: it suggests a clearer
 * draft and scriptures; only the author can apply or post anything.
 */
export function CompanionAssist({
  draft,
  onUseSuggestion,
}: {
  draft: string;
  onUseSuggestion: (text: string) => void;
}) {
  const [assist, setAssist] = useState<Assist | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (busy) return;
    setError(null);
    if (!draft.trim()) {
      setError("Write a draft first — the Companion helps polish it.");
      return;
    }
    setBusy(true);
    const res = await apiFetch("/companion/assist", {
      method: "POST",
      body: JSON.stringify({ draft }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("The Companion could not respond. Try again.");
      return;
    }
    setAssist((await res.json()) as Assist);
  }

  return (
    <div className="rounded-xl border border-equipping/50 bg-equipping-soft/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">✨ Prayer Companion</p>
        <Button
          type="button"
          variant="outline"
          onClick={ask}
          disabled={busy}
          className={cn("border-equipping text-ink hover:bg-equipping-soft/60")}
        >
          {busy ? "Thinking…" : assist ? "Ask again" : "Help me phrase this"}
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted">
        Suggestions only — nothing is posted until you decide.
      </p>
      {error && <p className="mt-2 text-sm text-brand">{error}</p>}

      {assist && (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg bg-white/70 p-3">
            <p className="text-sm whitespace-pre-wrap">{assist.suggestion}</p>
            <div className="mt-2">
              <Button
                type="button"
                variant="ghost"
                className="px-3 py-1 text-xs"
                onClick={() => onUseSuggestion(assist.suggestion)}
              >
                Use this wording
              </Button>
            </div>
          </div>
          {assist.scriptures.length > 0 && (
            <div className="space-y-2">
              {assist.scriptures.map((s) => (
                <div key={s.reference} className="rounded-lg bg-white/70 p-3">
                  <p className="text-xs font-semibold">{s.reference}</p>
                  <p className="mt-1 text-sm italic">“{s.text}”</p>
                  <p className="mt-1 text-xs text-muted">{s.why}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
