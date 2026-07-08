# Mellow

Connecting Christians worldwide. MVP scope: **Prayer Social** — a 100% free prayer app — plus the surrounding pillars.

## Stack
Turborepo · pnpm · Next.js (web) · Fastify (api) · Prisma + Postgres · Better Auth · Flint (AI) · Railway.

## Structure
- `apps/web` — Next.js frontend
- `apps/api` — Fastify API
- `packages/db` — Prisma schema + client
- `packages/shared` — Zod schemas + shared types
- `packages/ui` — shared React components
- `packages/ai` — Flint AI adapter

## Getting started
1. `pnpm install`
2. Copy `.env.example` → `.env`, fill values
3. `pnpm db:generate` (and `pnpm db:migrate` once `DATABASE_URL` points at a live Postgres)
4. `pnpm dev`

## Scripts
- `pnpm dev` — run web + api
- `pnpm db:studio` — Prisma Studio
- `pnpm db:seed` — seed dev data

## Scope
MVP = Prayer Social. See `MELLOW_MVP_BUILD_PLAN.md` for the phased plan and the Deferred backlog
(Calling / Equipping marketplaces, Eternal Profile / web3, tokenomics, DAO, on-chain donations).

**Deferred behind legal review:** MUST / veMUST token, DAO governance, Eternal Vault custody,
on-chain donations. Every "earn"/reward surface in the MVP is off-chain reputation points with
no monetary value until cleared.
