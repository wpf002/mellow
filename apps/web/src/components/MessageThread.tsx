"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Textarea, cn } from "./ui";
import { formatDate } from "@/lib/format";

/** A live 1:1 message thread. Polls for new messages (SSE/websockets deferred). */
export function MessageThread({
  conversationId,
  initialMessages,
  isGroup = false,
}: {
  conversationId: string;
  initialMessages: Message[];
  isGroup?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const markRead = useCallback(() => {
    void apiFetch(`/conversations/${conversationId}/read`, { method: "POST" });
  }, [conversationId]);

  const refresh = useCallback(async () => {
    const res = await apiFetch(`/conversations/${conversationId}/messages?limit=50`);
    if (!res.ok) return;
    const data = (await res.json()) as { items: Message[] };
    setMessages((prev) =>
      prev.length === data.items.length && prev[prev.length - 1]?.id === data.items[data.items.length - 1]?.id
        ? prev
        : data.items,
    );
  }, [conversationId]);

  // Mark read on open + poll for new messages.
  useEffect(() => {
    markRead();
    const t = setInterval(() => void refresh().then(markRead), 3000);
    return () => clearInterval(t);
  }, [markRead, refresh]);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const res = await apiFetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: text }),
    });
    setSending(false);
    if (!res.ok) return;
    const message = (await res.json()) as Message;
    setMessages((prev) => [...prev, message]);
    setBody("");
  }

  return (
    <div className="flex h-[70vh] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No messages yet. Say hello.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
                  m.mine
                    ? "rounded-br-sm bg-fellowship text-white"
                    : "rounded-bl-sm border border-line bg-surface",
                )}
              >
                {isGroup && !m.mine && (
                  <span className="mb-0.5 block text-xs font-semibold text-fellowship">
                    {m.sender.displayName}
                  </span>
                )}
                {m.body}
                <span
                  className={cn(
                    "mt-1 block text-[10px]",
                    m.mine ? "text-white/70" : "text-muted",
                  )}
                >
                  {formatDate(m.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-line pt-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(e);
            }
          }}
          placeholder="Write a message…"
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none"
        />
        <Button type="submit" disabled={sending} className="bg-fellowship hover:brightness-95">
          Send
        </Button>
      </form>
    </div>
  );
}
