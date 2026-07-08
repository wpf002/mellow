import Fastify from "fastify";
import cors from "@fastify/cors";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.WEB_ORIGIN ?? true,
    credentials: true,
  });

  app.get("/health", async () => ({ ok: true }));

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
