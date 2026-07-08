"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Prayer } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { cn } from "./ui";

/**
 * "I prayed" intercession button. Each press appends an append-only PrayerLog
 * event on the API; we reflect the refreshed derived counts it returns.
 */
export function PrayButton({
  prayerId,
  initialUniquePrayed,
  initialViewerHasPrayed,
  disabled,
}: {
  prayerId: string;
  initialUniquePrayed: number;
  initialViewerHasPrayed: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [uniquePrayed, setUniquePrayed] = useState(initialUniquePrayed);
  const [hasPrayed, setHasPrayed] = useState(initialViewerHasPrayed);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function pray() {
    if (busy || disabled) return;
    setBusy(true);
    const res = await apiFetch(`/prayers/${prayerId}/pray`, { method: "POST" });
    setBusy(false);
    if (!res.ok) return;
    const updated = (await res.json()) as Prayer;
    setUniquePrayed(updated.uniquePrayed);
    setHasPrayed(updated.viewerHasPrayed);
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={pray}
      disabled={busy || pending || disabled}
      aria-pressed={hasPrayed}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition disabled:opacity-60",
        hasPrayed
          ? "bg-prayer text-white hover:brightness-95"
          : "border border-prayer text-prayer hover:bg-prayer-soft/50",
      )}
    >
      <span aria-hidden>🙏</span>
      {hasPrayed ? "Prayed" : "I prayed"}
      <span className={cn("tabular-nums", hasPrayed ? "text-white/90" : "text-prayer/80")}>
        {uniquePrayed}
      </span>
    </button>
  );
}
