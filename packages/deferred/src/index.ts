// ===========================================================================
// @mellow/deferred — STRUCTURE ONLY. NOTHING HERE IS BUILT OR WIRED.
//
// This package reserves the shape of the deferred backlog (tokenomics, DAO,
// on-chain donations, Eternal Profile/Vault, and marketplace monetization). It
// contains documented interfaces and types, plus a hard OFF gate per feature.
//
// ⚠️  Per MELLOW_MVP_BUILD_PLAN.md and CLAUDE.md, every item here is deferred
//     behind legal / security / regulatory review and MUST NOT be built without
//     Will's explicit go. There is intentionally no runtime flag, env var, or
//     config that turns any of these on — `isCleared()` always returns false.
//     "Clearing" a gate is a deliberate, reviewed code change, not a toggle.
//
// Nothing in this package is imported by apps/api or apps/web. It is inert.
// ===========================================================================

export enum DeferredFeature {
  Tokenomics = "TOKENOMICS",
  DaoGovernance = "DAO_GOVERNANCE",
  OnChainDonations = "ON_CHAIN_DONATIONS",
  EternalProfile = "ETERNAL_PROFILE",
  EternalVault = "ETERNAL_VAULT",
  CallingMonetization = "CALLING_MONETIZATION",
  EquippingMonetization = "EQUIPPING_MONETIZATION",
}

export interface DeferredGate {
  feature: DeferredFeature;
  title: string;
  /** Why this is gated and what class of clearance it needs. */
  gate: string;
  /** Other deferred features that must be cleared and built first. */
  dependsOn: DeferredFeature[];
  /** Definition of ready — all must be true before ANY implementation begins. */
  readyWhen: string[];
}

/** The registry of gates. This is documentation with teeth, not config. */
export const DEFERRED_GATES: Record<DeferredFeature, DeferredGate> = {
  [DeferredFeature.Tokenomics]: {
    feature: DeferredFeature.Tokenomics,
    title: "Tokenomics — MUST / veMUST / Serve-to-Earn / staking",
    gate: "Securities-law exposure. Qualified securities counsel must sign off BEFORE any token contract, reward promise, or 'earn' surface with monetary value ships.",
    dependsOn: [],
    readyWhen: [
      "Securities counsel has classified the token and cleared the reward mechanics in writing.",
      "A jurisdiction strategy (who can hold/earn, geofencing) is defined.",
      "Off-chain reputation (Phase 5) remains the source of truth for any migration.",
    ],
  },
  [DeferredFeature.DaoGovernance]: {
    feature: DeferredFeature.DaoGovernance,
    title: "DAO governance",
    gate: "Depends entirely on Tokenomics (voting power derives from veMUST). Governance-as-securities and liability questions apply.",
    dependsOn: [DeferredFeature.Tokenomics],
    readyWhen: [
      "Tokenomics is cleared and live.",
      "Legal entity / foundation structure for governance decisions is established.",
    ],
  },
  [DeferredFeature.OnChainDonations]: {
    feature: DeferredFeature.OnChainDonations,
    title: "Blockchain donation & crowdfunding",
    gate: "KYC/AML obligations and charitable-solicitation registration (per-state/country) gate this. Money movement of any kind is out of scope until cleared.",
    dependsOn: [DeferredFeature.EternalVault],
    readyWhen: [
      "KYC/AML program and provider selected and legally reviewed.",
      "Charitable-solicitation registration completed where required.",
      "Custody path (Eternal Vault) cleared and built.",
    ],
  },
  [DeferredFeature.EternalProfile]: {
    feature: DeferredFeature.EternalProfile,
    title: "Eternal Profile (web3 DID)",
    gate: "did:eid identity + on-chain reputation mirror + ZK selective disclosure. Privacy/data-protection review required. Off-chain reputation (Phase 5) is the migration source of truth.",
    dependsOn: [],
    readyWhen: [
      "DID method and key-recovery UX chosen and security-reviewed.",
      "Privacy review of what reputation data is mirrored on-chain (GDPR/CCPA).",
      "A one-way mapping from Phase-5 ReputationEvent history is specified.",
    ],
  },
  [DeferredFeature.EternalVault]: {
    feature: DeferredFeature.EternalVault,
    title: "Eternal Vault (crypto wallet + data control)",
    gate: "Custody and key management. Security review required first; custody may carry money-transmitter implications.",
    dependsOn: [],
    readyWhen: [
      "Custody model decided (non-custodial vs. MPC vs. custodial) and security-reviewed.",
      "Money-transmitter / licensing analysis completed for the chosen model.",
      "Key recovery + incident response runbook exists.",
    ],
  },
  [DeferredFeature.CallingMonetization]: {
    feature: DeferredFeature.CallingMonetization,
    title: "Calling Center monetization (transaction fees)",
    gate: "The Calling Center UI is live (Phase 7); two-sided liquidity + any transaction fees are deferred. Payments provider + tax/marketplace-facilitator review required.",
    dependsOn: [],
    readyWhen: [
      "Payments provider integrated and PCI scope understood.",
      "Marketplace-facilitator tax obligations reviewed.",
      "Product decision that fees don't undermine the '100% free' promise for prayer.",
    ],
  },
  [DeferredFeature.EquippingMonetization]: {
    feature: DeferredFeature.EquippingMonetization,
    title: "Equipping Center monetization (creator payouts)",
    gate: "The Equipping Center UI is live (Phase 8); paid courses / creator payouts + moderation are deferred. Payouts (1099/tax), payments, and content-moderation policy required.",
    dependsOn: [],
    readyWhen: [
      "Payouts provider (e.g. Connect-style) integrated; creator tax onboarding built.",
      "Content-moderation policy + tooling defined.",
      "Refund / chargeback policy defined.",
    ],
  },
};

/**
 * The master kill-switch. Always false — there is deliberately no code path,
 * env var, or config that returns true. Un-deferring a feature means editing
 * this function (and the module below it) in a reviewed PR, only after the
 * feature's `readyWhen` checklist is fully satisfied.
 */
export function isCleared(_feature: DeferredFeature): boolean {
  return false;
}

export class DeferredFeatureError extends Error {
  constructor(public readonly feature: DeferredFeature) {
    const gate = DEFERRED_GATES[feature];
    super(
      `Deferred feature "${gate.title}" is not built. It is gated: ${gate.gate} ` +
        `Do not implement without an explicit go (see @mellow/deferred).`,
    );
    this.name = "DeferredFeatureError";
  }
}

/** Guard every deferred entrypoint with this. It throws until the gate clears. */
export function assertCleared(feature: DeferredFeature): void {
  if (!isCleared(feature)) throw new DeferredFeatureError(feature);
}

/**
 * Money is NEVER a float (project invariant). Any monetary value in the
 * deferred surfaces is BigInt minor units (cents / smallest token unit).
 */
export type MinorUnits = bigint;

export * from "./tokenomics.js";
export * from "./dao.js";
export * from "./donations.js";
export * from "./eternal-profile.js";
export * from "./eternal-vault.js";
export * from "./marketplace-monetization.js";
