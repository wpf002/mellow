import { DeferredFeature, assertCleared, type MinorUnits } from "./index.js";

// ---------------------------------------------------------------------------
// DAO governance — DEFERRED (depends entirely on Tokenomics). STRUCTURE ONLY.
//
// Voting power derives from veMUST. Nothing here proposes, tallies, or executes.
// ---------------------------------------------------------------------------

export type ProposalStatus = "DRAFT" | "ACTIVE" | "PASSED" | "REJECTED" | "EXECUTED";

export interface Proposal {
  id: string;
  authorId: string;
  title: string;
  body: string;
  status: ProposalStatus;
  createdAt: string;
  votingEndsAt: string;
}

export interface Vote {
  proposalId: string;
  userId: string;
  support: boolean;
  /** veMUST weight at snapshot — never a float. */
  weight: MinorUnits;
}

export interface DaoGovernance {
  propose(authorId: string, title: string, body: string): Promise<Proposal>;
  castVote(proposalId: string, userId: string, support: boolean): Promise<Vote>;
  tally(proposalId: string): Promise<{ for: MinorUnits; against: MinorUnits }>;
}

/** Reserved entrypoint. Throws until DAO governance is cleared and built. */
export function createDaoGovernance(): DaoGovernance {
  assertCleared(DeferredFeature.DaoGovernance);
  throw new Error("unreachable");
}
