"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui";

/** Poster-only: mark a listing as filled/closed. */
export function CloseJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function close() {
    if (busy) return;
    setBusy(true);
    const res = await apiFetch(`/jobs/${jobId}/close`, { method: "POST" });
    setBusy(false);
    if (!res.ok) return;
    startTransition(() => router.refresh());
  }

  return (
    <Button variant="outline" onClick={close} disabled={busy}>
      {busy ? "Closing…" : "Mark as filled / close"}
    </Button>
  );
}
