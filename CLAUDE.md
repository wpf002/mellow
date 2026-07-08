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
- **Phase 3** (Group Prayer + Prayer Life — completes the MVP) — **built + verified in browser +
  committed/pushed.** Models `PrayerGroup` / `GroupMember` / `PrayerDayMark` / `Challenge` /
  `ChallengeParticipation` + `GroupRole` enum + `Prayer.groupId` (migration
  `phase3_groups_prayer_life`). API: `routes/groups.ts` (CRUD, join/leave, post-into-group, member-
  gated feed), `routes/prayerLife.ts` (`/prayer-life/mark` + `/streak`, tz-aware via `lib/streak.ts`),
  `routes/challenges.ts` (create/list/join, derived progress). GROUP visibility now wired to
  membership; group prayers are kept off the global wall/profile. Shared: `group.ts` / `prayerLife.ts`
  / `challenge.ts`. Web: `/groups`, `/groups/[id]`, `/prayer-life` (+ `PrayerSubnav` Wall/Groups/
  Prayer Life). Streaks + challenge progress are **derived from append-only `PrayerDayMark` events**,
  computed in the user's timezone — verified across a tz midnight (Chicago day ≠ UTC day) and with a
  consecutive-run-with-gap streak.
- **MVP (Phases 0–3) is complete.**
- **Phase 4** (Fellowship Feed + Messaging) — **built + verified in browser + committed/pushed.**
  Models `Post` / `PostReaction` / `PostComment` / `Conversation` / `ConversationMember` / `Message`
  + `ReactionType` enum (migration `phase4_fellowship_messaging`). API: `routes/posts.ts` (create,
  `/feed`, detail, react/unreact, comments) with `lib/serializePost.ts` (derived reaction rollup +
  commentCount) and `lib/feedRanker.ts` — the **pure, swappable Agape Algorithm v0** (chronological
  candidate window + follow-graph affinity; AI re-rank lands in Phase 6); `routes/messages.ts`
  (conversations list/start with 1:1 dedupe, messages list/send, `/read`, derived unread). Shared:
  `post.ts` / `message.ts`. Web: the **Fellowship pillar landing (`/fellowship`) is the feed**, plus
  `/fellowship/[id]`, `/messages`, `/messages/[id]` (+ `FellowshipSubnav` Feed/Messages, `Message`
  button on profiles). Chat is **polling** (3s; SSE/websockets deferred per plan). Verified: post →
  feed (followed author affinity-boosted to top) → react (replace keeps total 1) + comment; two users
  DM with unread badges, read receipts, dedupe, and a live message arriving via polling.
- **Next per plan: Phase 5** (Reputation & Achievements — off-chain).

### Dev env gotcha (Phase 4 — don't revert)
`.claude/launch.json` pins **Node 24** for both `api` and `web` by prepending
`$HOME/.nvm/versions/node/v24.15.0/bin` to PATH inside an `sh -c` wrapper. The machine's nvm default
can revert to Node 18, which breaks Next.js (needs ≥20.9) and the API's `node --env-file` (needs
≥20.6). If Node 24 isn't the installed version, update the pinned path.

### API gotcha (Phase 3 fix — don't revert)
`apps/api/src/server.ts` registers a custom `application/json` content-type parser that treats an
**empty body as `undefined`**. The web client (`apiFetch`) sends `Content-Type: application/json` on
every request including bodyless POSTs (follow, `/pray`, group join/leave, `/prayer-life/mark`);
Fastify's default parser 400s those with `FST_ERR_CTP_EMPTY_JSON_BODY`. This was latent through
Phases 1–2 (those POSTs were only ever curl-tested without the header).

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
