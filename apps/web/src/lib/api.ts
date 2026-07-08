// Absolute API URL — used for SERVER-side calls (SSR in session.ts) and as the
// Next.js rewrite proxy target (see next.config.ts). NOT used in the browser:
// client requests go same-origin through `/api` so the session cookie is
// first-party (no cross-site cookie problem across split domains).
export const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Client-side fetch to the Mellow API. Goes same-origin via `/api`, which Next
 * rewrites to the API service — so the browser only ever talks to one origin
 * and the auth cookie is first-party.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`/api${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}
