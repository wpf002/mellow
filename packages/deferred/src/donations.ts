import { DeferredFeature, assertCleared, type MinorUnits } from "./index.js";

// ---------------------------------------------------------------------------
// Blockchain donation & crowdfunding — DEFERRED (KYC/AML + charitable-
// solicitation registration gate). STRUCTURE ONLY. No money moves.
// ---------------------------------------------------------------------------

export interface Campaign {
  id: string;
  organizerId: string;
  title: string;
  story: string;
  goal: MinorUnits; // cents; never a float
  raised: MinorUnits;
  currency: string; // ISO-4217 or token symbol
  createdAt: string;
}

export interface Donation {
  id: string;
  campaignId: string;
  donorId: string | null; // null = anonymous, subject to KYC thresholds
  amount: MinorUnits;
  currency: string;
  createdAt: string;
}

/** All methods require KYC/AML clearance on the donor and campaign organizer. */
export interface DonationProcessor {
  createCampaign(organizerId: string, title: string, goal: MinorUnits): Promise<Campaign>;
  donate(campaignId: string, donorId: string | null, amount: MinorUnits): Promise<Donation>;
}

/** Reserved entrypoint. Throws until donations are cleared and built. */
export function createDonationProcessor(): DonationProcessor {
  assertCleared(DeferredFeature.OnChainDonations);
  throw new Error("unreachable");
}
