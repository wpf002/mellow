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
- **Phase 5** (Reputation & Achievements — off-chain) — **built + verified in browser +
  committed/pushed.** Models `ReputationEvent` (append-only) + `ReputationCategory` enum /
  `Achievement` / `UserAchievement` (migration `phase5_reputation_achievements`). Engine in
  `apps/api/src/lib/reputation.ts`: weights live in code (`WEIGHTS`), score = **derived weighted sum
  by category** (never stored), badge engine = **pure function** over per-category tallies
  (`ACHIEVEMENTS` catalog in code; DB rows upserted from it; awards idempotent via
  `createMany skipDuplicates` on the `@@id([userId, achievementId])`). Events emitted from action
  routes via fire-and-forget `emitReputation` (never breaks the action): prayer create + group
  prayer → PRAYER_POSTED, `/pray` → INTERCESSION, prayer/post comments → ENCOURAGEMENT, `/answer` →
  TESTIMONY, post create → FELLOWSHIP, day mark → FAITHFULNESS (only when newly marked — mark/join
  routes now check-then-create instead of upsert so idempotent repeats don't double-emit), group or
  challenge create/join → COMMUNITY. API: `GET /users/:handle/reputation` + `/achievements`
  (evaluation runs lazily on the achievements read). Web: `ReputationCard` on `/[handle]` — score
  labeled "**no monetary value**", category chips, badge shelf (earned gold / unearned grayed).
  Verified: fresh actions → score 8 (2+3+2+1 per weights) → 3/8 badges awarded once (idempotent
  re-eval) → browser day-mark emits FAITHFULNESS (8→11) → idempotent re-mark stays 11. **No
  backfill**: activity predating Phase 5 earns nothing (events are the source of truth).
- **Phase 6** (AI Layer — **Claude via the Anthropic SDK, not Flint**, per Will) — **built +
  committed/pushed + verified LIVE in browser** (key now in gitignored `.env`; assist, thread
  summary, and the Agape v1 re-rank all confirmed with real model output — the re-rank visibly
  demoted a low-substance post below a substantive one; `ai_usage` token logs confirmed per call).
  `packages/ai` is the single Claude adapter (`@anthropic-ai/sdk`): `DEFAULT_MODEL` pinned in one
  constant (`claude-opus-4-8`, override via `AI_DEFAULT_MODEL`), lazy client, `complete()` logs
  **token usage on every call** (`ai_usage` JSON line), structured outputs via
  `output_config.format` json_schema + adaptive thinking. **Feature flag** `aiEnabled()` = key
  present && `AI_FEATURES` not off. Tasks in `packages/ai/src/tasks.ts`: `rankFeedAI` (Agape v1 —
  re-ranks the chronological candidate window; permutation-guarded), `assistPrayer` + 
  `summarizeThread` (Prayer Companion — **read-only, never posts**). API: `/feed` tries AI re-rank
  when enabled and **always falls back to the pure v0 ranker** on flag-off or any error (verified
  with a fake key: 200 + v0 order + warning log); `routes/companion.ts` → `/companion/status`,
  `/companion/assist`, `/prayers/:id/summary` (auth-gated, visibility-checked, 503 when disabled,
  502 on AI failure). Web: `CompanionAssist` panel in `PrayerComposer` ("use this wording" applies
  to the draft — user posts, not the AI) + `ThreadSummaryButton` on prayer detail; both hidden when
  `/companion/status` says disabled. **To activate:** set `ANTHROPIC_API_KEY` in `.env` (see
  `.env.example`); restart API. All phases 0–6 complete; deferred backlog still needs Will's go.
- **Phase 7** (Calling Center — the green pillar, **listings surface only**) — **built + verified in
  browser + committed/pushed.** Per Will's scope call, the pillar ships as a real product surface
  (not "coming soon"), but **all marketplace mechanics stay deferred behind review**: no fees,
  payouts, escrow, applications pipeline, or match AI — contact happens through the existing 1:1
  messaging and **no money moves through Mellow**. Models `JobListing` + `JobType`/`JobStatus` enums,
  `TalentProfile` (one per user, `visible` opt-in) (migration `phase7_calling_center`). API in
  `apps/api/src/routes/calling.ts`: `/jobs` create/list(OPEN, `?type=` filter)/detail/`:id/close`
  (poster-only 403 guard), `/talent` PUT-upsert + `/talent/me` + `/talent` directory (visible only).
  Shared: `calling.ts` (`JOB_TYPE_LABEL` shared web+api). Web: `/calling` openings board with type
  filter chips, `/calling/new`, `/calling/[id]` (reuses `MessageButton` to contact the poster +
  `CloseJobButton`), `/calling/talent` directory + own-profile `TalentEditor` (+ `CallingSubnav`
  Openings/Talent). Verified: post → browse → detail → contact reuses the existing 1:1 conversation
  (Phase-4 dedupe) → close flips to Closed + drops off the board; non-poster close 403; talent
  upsert + directory listing.
- **Phase 8** (Equipping Center — the gold pillar, **learning surface only**) — **built + verified in
  browser + committed/pushed.** Ships as a real surface (not "coming soon"); **creator payouts /
  monetization and content moderation stay deferred behind review** — courses are free, enrollment
  just tracks derived progress. Models `Course` + `CourseCategory` enum, `Lesson`, `Enrollment`,
  `LessonCompletion` (migration `phase8_equipping_center`). API in `apps/api/src/routes/equipping.ts`:
  `/courses` create(draft)/list(published, `?category=`)/detail(draft→author-only 404), `:id/publish`
  + `:id/lessons` (author-only 403), `:id/enroll`, `/lessons/:id/complete` (enrolled-only 403,
  idempotent), `/my/courses` (enrolled + teaching). Progress is **derived** (viewer completions /
  total lessons) via batch serializer `lib/serializeCourse.ts` — never stored. Shared: `equipping.ts`
  (`COURSE_CATEGORY_LABEL` shared web+api). Web: `/equipping` catalog + category chips, `/equipping/new`,
  `/equipping/[id]` (single `CourseView` client component: enroll, lesson accordion + mark-complete,
  progress bar, author publish/unpublish + add-lesson — all mutate and re-render from the returned
  detail), `/equipping/my` (Enrolled + Teaching), `EquippingSubnav`. Verified: create draft → add
  lessons → publish → catalog → 2nd user enrolls → completes lessons (1/2 → 2/2 "Course complete",
  idempotent) → My Learning; author-not-enrolled complete 403, non-author lesson-add 403, draft 404
  to non-authors. **All four pillars now ship as real product surfaces** — `PillarPlaceholder`
  removed. Deferred backlog (tokenomics/web3/DAO/on-chain + Calling & Equipping monetization) still
  needs Will's explicit go.

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
