"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui";

/** Join / leave toggle for a group. The owner cannot leave (handled server-side). */
export function JoinGroupButton({
  groupId,
  initialIsMember,
  isOwner,
}: {
  groupId: string;
  initialIsMember: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initialIsMember);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  if (isOwner) {
    return <span className="text-sm text-muted">You own this group</span>;
  }

  async function toggle() {
    setBusy(true);
    const res = await apiFetch(`/groups/${groupId}/${isMember ? "leave" : "join"}`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) return;
    setIsMember(!isMember);
    startTransition(() => router.refresh());
  }

  return (
    <Button variant={isMember ? "outline" : "primary"} onClick={toggle} disabled={busy}>
      {isMember ? "Leave group" : "Join group"}
    </Button>
  );
}
