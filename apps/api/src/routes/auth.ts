import type { FastifyInstance } from "fastify";
import { auth } from "@mellow/auth";

/**
 * Mounts Better Auth as a catch-all handler at `/api/auth/*`.
 * Fastify parses the JSON body; we hand Better Auth a standard `Request`.
 */
export async function registerAuthRoutes(app: FastifyInstance) {
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      try {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const headers = new Headers();
        for (const [key, value] of Object.entries(request.headers)) {
          if (value) headers.append(key, Array.isArray(value) ? value.join(",") : value.toString());
        }

        const req = new Request(url, {
          method: request.method,
          headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        const response = await auth.handler(req);

        reply.status(response.status);
        response.headers.forEach((value, key) => reply.header(key, value));
        reply.send(response.body ? await response.text() : null);
      } catch (error) {
        request.log.error(error, "auth handler error");
        reply.status(500).send({ error: "Internal authentication error" });
      }
    },
  });
}
