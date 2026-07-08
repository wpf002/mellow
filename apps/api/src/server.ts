import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerMeRoutes } from "./routes/me.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerPrayerRoutes } from "./routes/prayers.js";
import { registerGroupRoutes } from "./routes/groups.js";
import { registerPrayerLifeRoutes } from "./routes/prayerLife.js";
import { registerChallengeRoutes } from "./routes/challenges.js";
import { registerPostRoutes } from "./routes/posts.js";
import { registerMessageRoutes } from "./routes/messages.js";
import { registerReputationRoutes } from "./routes/reputation.js";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });

  // The web client sends `Content-Type: application/json` on every request,
  // including bodyless POSTs (follow, pray, join, mark). Fastify's default JSON
  // parser rejects those with FST_ERR_CTP_EMPTY_JSON_BODY, so treat an empty
  // body as `undefined` and otherwise parse normally.
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_req, body, done) => {
      const text = typeof body === "string" ? body.trim() : "";
      if (text.length === 0) return done(null, undefined);
      try {
        done(null, JSON.parse(text));
      } catch {
        const err = new Error("Invalid JSON body") as Error & { statusCode?: number };
        err.statusCode = 400;
        done(err, undefined);
      }
    },
  );

  app.get("/health", async () => ({ ok: true }));

  await registerAuthRoutes(app);
  await registerMeRoutes(app);
  await registerUserRoutes(app);
  await registerPrayerRoutes(app);
  await registerGroupRoutes(app);
  await registerPrayerLifeRoutes(app);
  await registerChallengeRoutes(app);
  await registerPostRoutes(app);
  await registerMessageRoutes(app);
  await registerReputationRoutes(app);

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
