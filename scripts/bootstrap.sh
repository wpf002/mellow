#!/usr/bin/env bash
# Reference bootstrap for the Mellow monorepo.
# NOTE: The repo has already been scaffolded (this script is kept for record and
# for re-provisioning from scratch). Running it over an existing checkout will
# overwrite files — review before use.
set -euo pipefail

echo "==> Scaffolding Mellow monorepo"

mkdir -p apps/web apps/api \
         packages/db/prisma packages/shared/src packages/ui/src packages/ai/src \
         scripts

echo "==> Root config, package manifests, and app scaffolds are committed in the repo."
echo "    Web app is created with:"
echo "      pnpm dlx create-next-app@latest apps/web --ts --app --eslint --tailwind --src-dir --import-alias '@/*' --no-turbopack"
echo ""
echo "==> Next steps:"
echo "   1) pnpm install"
echo "   2) fill .env from .env.example (Railway DATABASE_URL etc.)"
echo "   3) pnpm db:generate && pnpm db:migrate"
echo "   4) pnpm dev"
