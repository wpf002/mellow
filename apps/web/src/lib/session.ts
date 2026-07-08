import { cookies } from "next/headers";
import type {
  Challenge,
  Comment,
  Group,
  MeUser,
  Page,
  Prayer,
  PublicUser,
  Streak,
} from "@mellow/shared";
import { API_URL } from "./api";

/** Server-side: forward the browser's cookies to the API to resolve the viewer. */
export async function serverFetch(path: string): Promise<Response> {
  const cookieHeader = (await cookies()).toString();
  return fetch(`${API_URL}${path}`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
}

/** The current signed-in user, or null. */
export async function getMe(): Promise<MeUser | null> {
  const res = await serverFetch("/me");
  if (!res.ok) return null;
  return (await res.json()) as MeUser;
}

/** A public profile by handle (with viewer-relative flags), or null if 404. */
export async function getProfile(handle: string): Promise<PublicUser | null> {
  const res = await serverFetch(`/users/${encodeURIComponent(handle)}`);
  if (!res.ok) return null;
  return (await res.json()) as PublicUser;
}

/** The prayer wall, or one author's prayers when `author` is set. */
export async function getPrayers(opts?: { author?: string; limit?: number }): Promise<Page<Prayer>> {
  const params = new URLSearchParams();
  if (opts?.author) params.set("author", opts.author);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  const res = await serverFetch(`/prayers${qs ? `?${qs}` : ""}`);
  if (!res.ok) return { items: [], nextCursor: null };
  return (await res.json()) as Page<Prayer>;
}

/** A single prayer the viewer is allowed to see, or null. */
export async function getPrayer(id: string): Promise<Prayer | null> {
  const res = await serverFetch(`/prayers/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  return (await res.json()) as Prayer;
}

/** Comments on a prayer (chronological). */
export async function getPrayerComments(id: string): Promise<Page<Comment>> {
  const res = await serverFetch(`/prayers/${encodeURIComponent(id)}/comments?limit=50`);
  if (!res.ok) return { items: [], nextCursor: null };
  return (await res.json()) as Page<Comment>;
}

/** All prayer groups (discovery). */
export async function getGroups(): Promise<Page<Group>> {
  const res = await serverFetch("/groups?limit=50");
  if (!res.ok) return { items: [], nextCursor: null };
  return (await res.json()) as Page<Group>;
}

/** A single group's metadata, or null. */
export async function getGroup(id: string): Promise<Group | null> {
  const res = await serverFetch(`/groups/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  return (await res.json()) as Group;
}

/** A group's prayer feed. Empty when the viewer is not a member (403). */
export async function getGroupPrayers(id: string): Promise<Page<Prayer>> {
  const res = await serverFetch(`/groups/${encodeURIComponent(id)}/prayers?limit=30`);
  if (!res.ok) return { items: [], nextCursor: null };
  return (await res.json()) as Page<Prayer>;
}

/** The signed-in user's prayer streak, or null. */
export async function getStreak(): Promise<Streak | null> {
  const res = await serverFetch("/prayer-life/streak");
  if (!res.ok) return null;
  return (await res.json()) as Streak;
}

/** Prayer challenges with the viewer's derived progress. */
export async function getChallenges(): Promise<{ items: Challenge[] }> {
  const res = await serverFetch("/challenges");
  if (!res.ok) return { items: [] };
  return (await res.json()) as { items: Challenge[] };
}
