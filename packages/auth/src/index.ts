import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@mellow/db";

/**
 * The single Better Auth instance for Mellow.
 *
 * - Mounted as an HTTP handler by the API (`apps/api`) at `/api/auth/*`.
 * - Imported by the API's route guards to read the current session.
 *
 * Reads `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` from the environment.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // MVP: no email verification wall yet (no mail provider wired). Phase 6+.
    requireEmailVerification: false,
  },
  // The web app origin is allowed to call the auth endpoints with credentials.
  trustedOrigins: [process.env.WEB_ORIGIN ?? "http://localhost:3000"],
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day
  },
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];
