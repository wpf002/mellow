"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

/** Rail link to /notifications with a live unread badge (polls). */
export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    async function poll() {
      const res = await apiFetch("/notifications/unread-count");
      if (!res.ok || !alive) return;
      const { unreadCount } = (await res.json()) as { unreadCount: number };
      if (alive) setUnread(unreadCount);
    }
    void poll();
    const t = setInterval(poll, 20000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-black/5"
    >
      <span>Notifications</span>
      {unread > 0 && (
        <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
