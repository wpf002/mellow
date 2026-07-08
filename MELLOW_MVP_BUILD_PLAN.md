# Mellow (by mustadd) — MVP Master Build Plan

## 0. Brief (read first)

We are building **Mellow**, a platform to connect Christians worldwide. The full product vision
spans prayer, fellowship, a callings/jobs marketplace, an education hub, a web3 identity/reputation
profile, and a token economy (MUST / veMUST / Serve-to-Earn / DAO).

The **MVP is Prayer Social** — the "one and only 100% free prayer app" — plus the minimum social
scaffolding around it. Everything else is in the Deferred section and is out of MVP scope.

> **Note on this build:** the four content pillars (Prayer Social, Fellowship Social, Calling
> Center, Equipping Center) are being built out as one product surface rather than strictly phased.
> The **token / veMUST / DAO / Eternal Vault custody / on-chain donations** layers remain deferred
> behind legal review. Every "earn"/reward surface stays **off-chain reputation points with no
> monetary value** until cleared.

### Stack (non-negotiable)
- Monorepo: pnpm workspaces + Turborepo
- Web: Next.js (App Router, TypeScript, RSC where sensible)
- API: Fastify (TypeScript)
- DB: Postgres via Prisma
- Validation: Zod at every API boundary and every form
- Auth: Better Auth (owned/self-hosted, TS-native)
- Hosting: Railway (Postgres + both apps)
- AI layer: Flint as the provider-agnostic adapter. Default model pinned in one config constant.

### Conventions & invariants (enforce everywhere)
- TypeScript `strict: true`. No `any` without a `// TODO` and a reason.
- Money is never a float. If any monetary field appears, it is `BigInt` cents.
- Derived, never stored: prayer streaks, reputation scores, "answered" rollups, unread counts.
  Store the events; compute the view. Cache at the read layer only, with a clear invalidation path.
- Append-only event tables for anything feeding reputation or streaks (`PrayerLog`,
  `ReputationEvent`). Never mutate history.
- Every list endpoint is cursor-paginated. No unbounded queries.
- Visibility is a first-class enum on user content (`PUBLIC | FRIENDS | GROUP | PRIVATE`), enforced
  in the query layer, not the UI.
- One shared Zod schema per entity in `packages/shared`, imported by both web and api.

## Phase 0 — Repository & Infrastructure Bootstrap
Objective: a running empty monorepo, deployable to Railway, before a single feature.
- Monorepo scaffold (Turborepo + Next.js + Fastify + Prisma), package manifests, config.
- Railway: Postgres plugin + two services (`web`, `api`).
- **DoD:** `pnpm dev` runs; `GET /health` returns `{ok:true}`; Next.js home renders; repo pushed to
  `wpf002/mellow`; Postgres reachable via `pnpm db:studio`.

## Phase 1 — Foundation: Auth, Users, Profiles
- Models: `User`, `Follow`, `Visibility` enum.
- API: `POST /auth/*` (Better Auth), `GET/PATCH /me`, `GET /users/:handle`, follow/unfollow.
- Web: `/sign-in`, `/sign-up`, `/onboarding`, `/[handle]`, `/settings/profile`.
- **DoD:** sign up → onboarding → profile at `/[handle]`; follow/unfollow works; `/me` gated.

## Phase 2 — Prayer Social Core (the MVP)
- Models: `Prayer`, `PrayerLog` (append-only), `Comment`, `Testimonial`, `PrayerStatus` enum.
- API: prayers CRUD (cursor-paginated, visibility-filtered), `/pray`, comments, `/answer`.
- Derived counts (`uniquePrayed`, `totalPrayed`) computed in the query, never stored.
- Web: `/` prayer wall, `/prayers/new`, `/prayers/[id]`, profile prayers tab.
- **DoD:** create → wall → another user prays + comments → author marks answered w/ testimonial →
  answered state + count render; visibility respected.

## Phase 3 — Group Prayer + Prayer Life (completes MVP)
- Models: `PrayerGroup`, `GroupMember`, `PrayerDayMark` (streak source), `Challenge`,
  `ChallengeParticipation`, `GroupRole` enum.
- API: groups CRUD/join/leave, `/prayer-life/mark`, `/prayer-life/streak`, challenges.
- Web: `/groups`, `/groups/[id]`, `/prayer-life` (streak calendar + challenges).
- **DoD:** create/join group + post prayer into it; mark daily and watch streak compute across a
  timezone midnight; join a challenge and see derived progress.

## Phase 4 — Fellowship Feed + Messaging
- Models: `Post`, `PostReaction`, `PostComment`, `Conversation`, `ConversationMember`, `Message`.
- Feed ("Agape Algorithm" v0): chronological + follow-graph affinity, pure & swappable. No AI yet.
- Chat: polling or SSE first; defer websockets.
- Web: `/feed`, `/messages`, `/messages/[conversationId]`.

## Phase 5 — Reputation & Achievements (off-chain)
- Models: `ReputationEvent` (append-only), `Achievement`, `UserAchievement`.
- Scores derived from events (weighted sum by category). Badge engine is a pure function.
- **Off-chain only** — the future Eternal Profile web3 layer mirrors this later.

## Phase 6 — AI Layer (Flint)
- Agape Algorithm v1: AI re-rank over the Phase-4 candidate feed, feature-flagged with v0 fallback.
- Prayer Companion: compose assist, scripture suggestions, thread summary. Read-only; never posts.
- All AI calls go through `@mellow/ai`; one `DEFAULT_MODEL`; log token usage.

## Deferred Backlog (explicit go from Will required)
1. **Calling Center** marketplace mechanics — job/talent listings, missions, match AI (UI is built;
   two-sided liquidity + any transaction fees are deferred).
2. **Equipping Center** payouts — courses, mentorship, creator payouts, moderation (UI is built;
   payments/moderation deferred).
3. **Eternal Profile (web3 DID)** — `did:eid:…`, on-chain reputation mirror, ZK selective disclosure.
   Off-chain reputation (Phase 5) is the migration source of truth.
4. **Eternal Vault** — crypto wallet + data control. Custody/keys: security review required first.
5. **Tokenomics** — MUST / veMUST / Serve-to-Earn / staking. **Securities-law exposure — qualified
   legal review BEFORE any token contract or reward promise.** Keep all "earn" surfaces off-chain
   with no monetary value until cleared.
6. **DAO governance** — depends entirely on (5).
7. **Blockchain donation & crowdfunding** — KYC/AML + charitable-solicitation registration gate.
8. **Decentralized data network** — M-Tree / Christian Node. Infra R&D; not PMF-critical.

## Build order
Phase 0 → 1 → 2 → 3 = ship the MVP. Then 4 → 5 → 6. Deferred backlog waits for an explicit go.
