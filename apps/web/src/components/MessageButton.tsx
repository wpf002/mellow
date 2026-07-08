"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui";

/** Starts (or reuses) a 1:1 conversation and opens it. */
export function MessageButton({ handle }: { handle: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    const res = await apiFetch("/conversations", {
      method: "POST",
      body: JSON.stringify({ handle }),
    });
    setBusy(false);
    if (!res.ok) return;
    const { id } = (await res.json()) as { id: string };
    router.push(`/messages/${id}`);
  }

  return (
    <Button variant="outline" onClick={open} disabled={busy}>
      Message
    </Button>
  );
}
