"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Streak } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui";

/** Marks today as a prayer day and shows the live streak. */
export function MarkPrayerDayButton({ initialStreak }: { initialStreak: Streak }) {
  const router = useRouter();
  const [streak, setStreak] = useState(initialStreak);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function mark() {
    if (busy || streak.todayMarked) return;
    setBusy(true);
    const res = await apiFetch("/prayer-life/mark", { method: "POST" });
    setBusy(false);
    if (!res.ok) return;
    setStreak((await res.json()) as Streak);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-prayer">{streak.current}</span>
        <span className="text-sm text-muted">
          day{streak.current === 1 ? "" : "s"} streak · longest {streak.longest}
        </span>
      </div>
      <Button onClick={mark} disabled={busy || streak.todayMarked}>
        {streak.todayMarked ? "Marked" : "Mark"}
      </Button>
    </div>
  );
}
