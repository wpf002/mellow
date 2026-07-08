"use client";
import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client. Talks to the handler same-origin at `/api/auth/*`, which
 * Next rewrites to the API service — keeping the session cookie first-party so
 * login persists (no cross-site cookie across split web/API domains).
 */
export const authClient = createAuthClient({ basePath: "/api/auth" });

export const { signIn, signUp, signOut, useSession } = authClient;
