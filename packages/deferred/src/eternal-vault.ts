import { DeferredFeature, assertCleared } from "./index.js";

// ---------------------------------------------------------------------------
// Eternal Vault (crypto wallet + data control) — DEFERRED (security review +
// custody/money-transmitter analysis). STRUCTURE ONLY. Holds nothing.
// ---------------------------------------------------------------------------

export type CustodyModel = "non_custodial" | "mpc" | "custodial";

export interface WalletAccount {
  userId: string;
  address: string;
  custody: CustodyModel;
}

export interface EternalVault {
  custody: CustodyModel;
  /** Provision (or resolve) the user's wallet under the chosen custody model. */
  accountFor(userId: string): Promise<WalletAccount>;
  /** Export the user's own data bundle (data-control promise). Read path only. */
  exportData(userId: string): Promise<Uint8Array>;
}

/** Reserved entrypoint. Throws until the Vault's custody model is cleared. */
export function createEternalVault(): EternalVault {
  assertCleared(DeferredFeature.EternalVault);
  throw new Error("unreachable");
}
