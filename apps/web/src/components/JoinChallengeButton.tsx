"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui";

export function JoinChallengeButton({
  challengeId,
  initialJoined,
}: {
  challengeId: string;
  initialJoined: boolean;
}) {
  const router = useRouter();
  const [joined, setJoined] = useState(initialJoined);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function join() {
    if (busy || joined) return;
    setBusy(true);
    const res = await apiFetch(`/challenges/${challengeId}/join`, { method: "POST" });
    setBusy(false);
    if (!res.ok) return;
    setJoined(true);
    startTransition(() => router.refresh());
  }

  if (joined) return <span className="text-sm font-semibold text-calling">✓ Joined</span>;
  return (
    <Button variant="outline" onClick={join} disabled={busy}>
      Join
    </Button>
  );
}
