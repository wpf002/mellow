# Mellow web (Next.js 16). Build context = repo root (pnpm workspace).
# Point Railway at this file with RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile.
FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* is inlined at build time, so the API URL must be present now.
# Railway passes service variables as build args to Dockerfile builds.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @mellow/web build

ENV NODE_ENV=production

# next start binds to $PORT (Railway-provided), defaulting to 3000 locally.
CMD ["sh", "-c", "cd /app/apps/web && pnpm exec next start -p ${PORT:-3000}"]
