"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Left-nav search field — submits to the global /search page. */
export function SearchBox({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form
      onSubmit={submit}
      className="mb-2 hidden items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 lg:flex"
    >
      <span aria-hidden>🔍</span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search Mellow"
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
      />
    </form>
  );
}
