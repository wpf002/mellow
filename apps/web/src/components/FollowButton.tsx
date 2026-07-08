"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui";

export function FollowButton({
  handle,
  initialFollowing,
}: {
  handle: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  async function toggle() {
    const next = !following;
    setFollowing(next); // optimistic
    const res = await apiFetch(`/users/${handle}/follow`, {
      method: next ? "POST" : "DELETE",
    });
    if (!res.ok) {
      setFollowing(!next); // revert
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <Button variant={following ? "outline" : "primary"} onClick={toggle} disabled={pending}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
