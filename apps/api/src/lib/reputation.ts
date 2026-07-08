import { prisma, type ReputationCategory } from "@mellow/db";
import type { Reputation } from "@mellow/shared";

// ---------------------------------------------------------------------------
// Reputation engine (Phase 5) — OFF-CHAIN, no monetary value.
//
// ReputationEvent rows are append-only; the score is a derived weighted sum by
// category, computed here on read. Weights live in code (pure config) so
// history stays intact if they're re-tuned. The badge engine below is a pure
// function over per-category event tallies.
// ---------------------------------------------------------------------------

/** Points per event, by category. Tune freely — events are the source of truth. */
export const WEIGHTS: Record<ReputationCategory, number> = {
  PRAYER_POSTED: 2,
  INTERCESSION: 3, // praying for others is the heart of the product
  ENCOURAGEMENT: 2,
  TESTIMONY: 10,
  FELLOWSHIP: 1,
  FAITHFULNESS: 3,
  COMMUNITY: 5,
};

export const CATEGORIES = Object.keys(WEIGHTS) as ReputationCategory[];

/**
 * Append a reputation event. Fire-and-forget from action routes — reputation
 * must never break the action itself, so failures are logged and swallowed.
 */
export async function emitReputation(
  userId: string,
  category: ReputationCategory,
  refId?: string,
): Promise<void> {
  try {
    await prisma.reputationEvent.create({ data: { userId, category, refId } });
  } catch (e) {
    console.error("reputation emit failed", { userId, category, refId, e });
  }
}

/** Tally events per category for a user (single groupBy query). */
export async function tallyEvents(userId: string): Promise<Record<ReputationCategory, number>> {
  const groups = await prisma.reputationEvent.groupBy({
    by: ["category"],
    where: { userId },
    _count: { _all: true },
  });
  const tally = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
    ReputationCategory,
    number
  >;
  for (const g of groups) tally[g.category] = g._count._all;
  return tally;
}

/** Pure: weighted score + per-category breakdown from an event tally. */
export function computeReputation(tally: Record<ReputationCategory, number>): Reputation {
  const breakdown = CATEGORIES.map((category) => ({
    category,
    events: tally[category],
    points: tally[category] * WEIGHTS[category],
  })).filter((b) => b.events > 0);
  return { score: breakdown.reduce((sum, b) => sum + b.points, 0), breakdown };
}

// ---------------------------------------------------------------------------
// Badge engine — pure function over event tallies. Definitions here are the
// source of truth; Achievement rows are upserted from them on evaluation.
// ---------------------------------------------------------------------------

export interface AchievementDef {
  code: string;
  title: string;
  description: string;
  /** Pure qualification check over the per-category tally. */
  qualifies: (tally: Record<ReputationCategory, number>) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    code: "FIRST_PRAYER",
    title: "First Prayer",
    description: "Shared your first prayer request.",
    qualifies: (t) => t.PRAYER_POSTED >= 1,
  },
  {
    code: "INTERCESSOR",
    title: "Intercessor",
    description: "Prayed for someone else.",
    qualifies: (t) => t.INTERCESSION >= 1,
  },
  {
    code: "INTERCESSOR_10",
    title: "Faithful Intercessor",
    description: "Prayed for others 10 times.",
    qualifies: (t) => t.INTERCESSION >= 10,
  },
  {
    code: "ENCOURAGER",
    title: "Encourager",
    description: "Left 5 encouraging comments.",
    qualifies: (t) => t.ENCOURAGEMENT >= 5,
  },
  {
    code: "WITNESS",
    title: "Witness",
    description: "Testified to an answered prayer.",
    qualifies: (t) => t.TESTIMONY >= 1,
  },
  {
    code: "FELLOWSHIP_VOICE",
    title: "Fellowship Voice",
    description: "Shared your first fellowship post.",
    qualifies: (t) => t.FELLOWSHIP >= 1,
  },
  {
    code: "DAILY_BREAD",
    title: "Daily Bread",
    description: "Marked 7 days of prayer.",
    qualifies: (t) => t.FAITHFULNESS >= 7,
  },
  {
    code: "COMMUNITY_BUILDER",
    title: "Community Builder",
    description: "Created or joined a group or challenge.",
    qualifies: (t) => t.COMMUNITY >= 1,
  },
];

/** Pure: which achievement codes a tally qualifies for. */
export function qualifiedCodes(tally: Record<ReputationCategory, number>): string[] {
  return ACHIEVEMENTS.filter((a) => a.qualifies(tally)).map((a) => a.code);
}

/**
 * Award any newly-qualified achievements (idempotent: unique on
 * user+achievement, createMany skips duplicates). Returns nothing the caller
 * needs — the read path re-queries.
 */
export async function evaluateAchievements(
  userId: string,
  tally: Record<ReputationCategory, number>,
): Promise<void> {
  const codes = qualifiedCodes(tally);
  if (codes.length === 0) return;

  // Ensure catalog rows exist for the definitions (stable FK targets).
  await Promise.all(
    ACHIEVEMENTS.filter((a) => codes.includes(a.code)).map((a) =>
      prisma.achievement.upsert({
        where: { code: a.code },
        create: { code: a.code, title: a.title, description: a.description },
        update: { title: a.title, description: a.description },
      }),
    ),
  );

  const rows = await prisma.achievement.findMany({ where: { code: { in: codes } } });
  await prisma.userAchievement.createMany({
    data: rows.map((r) => ({ userId, achievementId: r.id })),
    skipDuplicates: true,
  });
}
