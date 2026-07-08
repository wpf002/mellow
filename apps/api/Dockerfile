# Mellow API (Fastify + Prisma). Build context = repo root (pnpm workspace).
# Point Railway at this file with RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile.
FROM node:20-slim

# Prisma needs openssl at runtime.
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

WORKDIR /app

# Install all workspace deps (dev deps included: tsx runs the API, prisma CLI).
COPY . .
RUN pnpm install --frozen-lockfile

# Generate the Prisma client for this platform.
RUN pnpm --filter @mellow/db exec prisma generate

ENV NODE_ENV=production

# Apply migrations, then boot the API (listens on $PORT).
CMD ["sh", "-c", "cd /app/packages/db && pnpm exec prisma migrate deploy && cd /app/apps/api && pnpm exec tsx src/server.ts"]
