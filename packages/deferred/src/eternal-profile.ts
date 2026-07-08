import { DeferredFeature, assertCleared } from "./index.js";

// ---------------------------------------------------------------------------
// Eternal Profile (web3 DID) — DEFERRED (privacy review). STRUCTURE ONLY.
//
// A did:eid identity with an ON-CHAIN MIRROR of off-chain reputation, plus ZK
// selective disclosure. Phase-5 ReputationEvent history is the ONE-WAY source
// of truth for the mirror; the mirror never writes back to the app. In the MVP,
// "My Eternal Profile" is just the normal profile page at /[handle].
// ---------------------------------------------------------------------------

/** did:eid:<method-specific-id>. */
export type Did = `did:eid:${string}`;

export interface EternalProfile {
  userId: string;
  did: Did;
  /** Categories the user chose to disclose (ZK-proved), not raw scores. */
  disclosedCategories: string[];
}

export interface EternalProfileMirror {
  /** Derive a DID for a user (idempotent). */
  didFor(userId: string): Promise<Did>;
  /** Publish a selective-disclosure proof of reputation. Read-only mirror. */
  publishDisclosure(userId: string, categories: string[]): Promise<EternalProfile>;
}

/** Reserved entrypoint. Throws until Eternal Profile is cleared and built. */
export function createEternalProfileMirror(): EternalProfileMirror {
  assertCleared(DeferredFeature.EternalProfile);
  throw new Error("unreachable");
}
