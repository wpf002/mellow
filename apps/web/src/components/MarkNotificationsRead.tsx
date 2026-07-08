"use client";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

/** Fire-and-forget: marks the viewer's notifications read when the page opens. */
export function MarkNotificationsRead() {
  useEffect(() => {
    void apiFetch("/notifications/read", { method: "POST" });
  }, []);
  return null;
}
