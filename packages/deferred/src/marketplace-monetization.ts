import { DeferredFeature, assertCleared, type MinorUnits } from "./index.js";

// ---------------------------------------------------------------------------
// Marketplace monetization — DEFERRED. STRUCTURE ONLY. No payments, no payouts.
//
// The Calling Center (Phase 7) and Equipping Center (Phase 8) ship as FREE
// surfaces. This reserves the shape of the revenue mechanics deferred behind
// payments-provider integration, tax/marketplace-facilitator review, creator
// payout onboarding (1099), and content-moderation policy.
// ---------------------------------------------------------------------------

// --- Calling Center: transaction / listing fees -----------------------------

export interface ListingFee {
  jobListingId: string;
  amount: MinorUnits; // cents; never a float
  currency: string;
}

export interface CallingMonetization {
  /** Charge a posting or transaction fee. Requires a cleared payments path. */
  chargeListingFee(jobListingId: string, amount: MinorUnits): Promise<ListingFee>;
}

export function createCallingMonetization(): CallingMonetization {
  assertCleared(DeferredFeature.CallingMonetization);
  throw new Error("unreachable");
}

// --- Equipping Center: paid courses + creator payouts -----------------------

export interface CoursePrice {
  courseId: string;
  amount: MinorUnits;
  currency: string;
}

export interface CreatorPayout {
  courseId: string;
  creatorId: string;
  amount: MinorUnits;
  currency: string;
}

export interface EquippingMonetization {
  setPrice(courseId: string, amount: MinorUnits): Promise<CoursePrice>;
  /** Pay a creator out. Requires payout onboarding + tax (1099) handling. */
  payoutCreator(courseId: string, creatorId: string, amount: MinorUnits): Promise<CreatorPayout>;
}

export function createEquippingMonetization(): EquippingMonetization {
  assertCleared(DeferredFeature.EquippingMonetization);
  throw new Error("unreachable");
}
