import type { FastifyReply, FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@mellow/auth";

/** Returns the authenticated user's id, or null if there is no valid session. */
export async function getUserId(request: FastifyRequest): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });
  return session?.user.id ?? null;
}

/**
 * Guard for protected routes. On success returns the user id; on failure it has
 * already sent a 401 and returns null — callers should `return` immediately.
 */
export async function requireUserId(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<string | null> {
  const userId = await getUserId(request);
  if (!userId) {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }
  return userId;
}
