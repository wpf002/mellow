# Mellow — working notes for Claude

Mellow (product of **mustadd**, logo "MUST") — a platform to connect Christians worldwide.
Repo: `github.com/wpf002/mellow`. Full plan: `MELLOW_MVP_BUILD_PLAN.md`.

## Scope decisions (from Will — read before building)
- Build **all four content pillars** as one product surface (not phased / not "coming soon"):
  Prayer Social (coral), Fellowship Social (blue), Calling Center (green), Equipping Center (gold).
- **Deferred behind legal review — do NOT build without an explicit go:** MUST/veMUST token, DAO
  governance, Eternal Vault custody, on-chain donations/crowdfunding. Every "earn"/reward surface
  stays **off-chain reputation points with no monetary value** until cleared. "My Eternal Profile"
  in the MVP = a normal profile page (web3 DID deferred). Translate / Translator AI = stubbed until
  the Flint phase.
- Design language: 3-column app layout (left filter nav · center feed · right utility rail), pill
  buttons, rounded cards, light-gray canvas, per-pillar accent color. Coral = brand primary.

## Architecture
Monorepo: pnpm workspaces + Turborepo.
- `apps/web` — Next.js 16 / React 19 / Tailwind v4. Imports only `@mellow/shared` + `@mellow/ui`
  (never `@mellow/db`/`@mellow/auth` — those are server-only). `transpilePackages` set for the two.
- `apps/api` — Fastify 5, ESM (`"type":"module"`, `moduleResolution: NodeNext` → relative imports
  need `.js` extensions). Mounts Better Auth at `/api/auth/*`; also hosts domain routes.
- `packages/db` — Prisma schema + client (`@mellow/db`).
- `packages/auth` — the single Better Auth instance (`@mellow/auth`), Prisma adapter, email+password.
- `packages/shared` — Zod schemas + shared types (`@mellow/shared`). Barrel uses `.js` extensions.
- `packages/ui`, `packages/ai` — shared components / Flint adapter (`DEFAULT_MODEL` pinned).

Auth: handler lives on the **API** (`:4000`). Cookies are set on `localhost` (port-agnostic), so the
web app (`:3000`) shares the session. Web uses the Better Auth React client (`baseURL = API`). SSR
pages forward the browser cookie to the API to resolve the viewer.

Invariants: TS strict; derived-never-stored (follow counts, streaks, etc.); append-only event tables;
cursor pagination on lists; `Visibility` enforced in the query layer; one Zod schema per entity in
`@mellow/shared` shared by web+api.

## Dependency gotcha (don't "fix" this)
Better Auth is pinned to **`~1.2.12`** (the last zod-3 line) and `package.json` has a pnpm override
`"better-call": "1.0.19"` — both to keep the whole app on **zod 3** per the plan. 1.3+ requires zod 4.

## Local dev
- Postgres runs in Docker: container `mellow-pg` on host port **5455** (`postgres/postgres`, db
  `mellow`). Start if missing:
  `docker run -d --name mellow-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=mellow -p 5455:5432 postgres:16`
- `.env` (gitignored) holds `DATABASE_URL` (→ 5455), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
  (`http://localhost:4000`), `WEB_ORIGIN`, `NEXT_PUBLIC_API_URL`. `apps/web/.env.local` has
  `NEXT_PUBLIC_API_URL` (Next loads env from the app dir, not the repo root).
- Commands: `pnpm install` · `pnpm dev` (web :3000 + api :4000) · `pnpm typecheck` ·
  `pnpm --filter @mellow/db migrate` / `studio` / `generate`.
- The API loads env via `--env-file=../../.env`; Prisma commands via `dotenv -e ../../.env`.

## Status
- **Phase 0** (bootstrap) — done, pushed.
- **Phase 1** (auth / users / profiles) — built + committed + pushed. Verified end-to-end at the
  **API** level via curl AND now in a **browser** (sign up → onboarding → profile at `/[handle]`,
  follow counts, `/me` gate via redirect).
- **Phase 2** (Prayer Social core) — **built + verified in browser, not yet committed.** Models
  `Prayer` / `PrayerLog` (append-only) / `Comment` / `Testimonial` + `PrayerStatus` enum (migration
  `phase2_prayer_social`). API routes in `apps/api/src/routes/prayers.ts` (create, wall + profile
  list cursor-paginated & visibility-filtered, detail, `/pray`, comments, `/answer`) with a batch
  serializer (`lib/serializePrayer.ts`) that derives `uniquePrayed`/`totalPrayed`/`commentCount` —
  never stored. Shared schemas in `packages/shared/src/prayer.ts`. Web: `/` wall, `/prayers/new`,
  `/prayers/[id]`, profile prayers tab (`PrayerCard`, `PrayButton`, composers, `AnswerPrayerForm`).
  Verified: create → wall → 2nd user prays (unique vs total) + comments → author answers w/
  testimonial → answered state renders; PUBLIC/PRIVATE/FRIENDS(mutual-follow) visibility; 401/403/409
  guards. Visibility rule: `FRIENDS` = **mutual follow**; `GROUP` deferred to Phase 3 (author-only
  for now); compose offers PUBLIC/FRIENDS/PRIVATE.
- **Next: Phase 3** — Group Prayer + Prayer Life (groups, `PrayerDayMark` streaks, challenges).

## Web bundler note (Phase 1 fix — don't revert)
`apps/web` builds with **Webpack**, not Turbopack (`dev`/`build` use `--webpack`; `next.config.ts`
sets `experimental.extensionAlias` `.js`→`.ts`). Reason: the `@mellow/shared`/`@mellow/ui` barrels
re-export with `.js` extensions (required so the NodeNext **API** typechecks the same source), and
Turbopack does not substitute `.js`→`.ts` inside symlinked workspace packages — every page importing
the shared barrel 500s with "Can't resolve './pagination.js'". Webpack's `extensionAlias` fixes it.
Also: `.claude/launch.json` wraps the web `dev` in `sh -c "ulimit -n 10240; …"` because the macOS GUI
fd limit (256) makes the dev server throw `EMFILE: too many open files` and 404 every route.

## Guardrail
Work only in this repo. Do not touch or push to any other repo (e.g. crossbar). Commits/pushes go to
`origin` = `github.com/wpf002/mellow` only.
