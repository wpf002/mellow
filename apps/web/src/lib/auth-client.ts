"use client";
import { createAuthClient } from "better-auth/react";
import { API_URL } from "./api";

/** Better Auth talks to the handler mounted on the API (`/api/auth/*`). */
export const authClient = createAuthClient({ baseURL: API_URL });

export const { signIn, signUp, signOut, useSession } = authClient;
