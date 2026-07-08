import { cookies } from "next/headers";
import type { MeUser, PublicUser } from "@mellow/shared";
import { API_URL } from "./api";

/** Server-side: forward the browser's cookies to the API to resolve the viewer. */
async function serverFetch(path: string): Promise<Response> {
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
