import { DeferredFeature, assertCleared, type MinorUnits } from "./index.js";

// ---------------------------------------------------------------------------
// Tokenomics — DEFERRED (securities-law exposure). STRUCTURE ONLY.
//
// MUST (utility/reward token), veMUST (vote-escrowed, time-locked), and
// Serve-to-Earn (reputation → token conversion). Until cleared, EVERY reward
// surface stays off-chain reputation points with NO monetary value (Phase 5).
// These types reserve the shape; nothing mints, transfers, or values anything.
// ---------------------------------------------------------------------------

export type TokenSymbol = "MUST" | "veMUST";

export interface TokenAmount {
  symbol: TokenSymbol;
  /** Smallest token unit — never a float. */
  amount: MinorUnits;
}

/** A vote-escrow lock: MUST locked for a duration yields veMUST voting weight. */
export interface VeLock {
  userId: string;
  locked: MinorUnits;
  unlockAt: string; // ISO
  votingWeight: MinorUnits; // decays toward unlock
}

/**
 * Serve-to-Earn rule: maps an off-chain ReputationCategory (Phase 5) to a token
 * reward. DEFERRED — no conversion rate may exist until securities-cleared, or
 * the off-chain points acquire de-facto monetary value.
 */
export interface ServeToEarnRule {
  reputationCategory: string; // @mellow/shared ReputationCategory
  perEventReward: MinorUnits;
  dailyCap: MinorUnits;
}

export interface TokenLedger {
  balanceOf(userId: string): Promise<TokenAmount>;
  lock(userId: string, amount: MinorUnits, unlockAt: string): Promise<VeLock>;
  votingWeightOf(userId: string): Promise<MinorUnits>;
}

/** Reserved entrypoint. Throws until Tokenomics is cleared and built. */
export function createTokenLedger(): TokenLedger {
  assertCleared(DeferredFeature.Tokenomics);
  throw new Error("unreachable"); // assertCleared always throws while deferred
}
