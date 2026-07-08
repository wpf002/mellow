# @mellow/deferred — reserved structure for the deferred backlog

**Nothing in this package is built, wired, or callable.** It is inert scaffolding:
documented interfaces + a hard OFF gate per feature. It exists so the deferred
backlog has an agreed shape and an unambiguous place to live, and so no one
"accidentally" ships a regulated feature.

- Not a dependency of `apps/api` or `apps/web`. Importing it and calling any
  factory throws `DeferredFeatureError`.
- `isCleared()` **always returns false.** There is no env var, config, or runtime
  toggle. Un-deferring is a deliberate, reviewed code change — never a switch.
- **Every item below needs Will's explicit go**, gated on the listed clearance.
  Until then, all "earn"/reward surfaces stay **off-chain reputation points with
  no monetary value** (Phase 5), and no money moves through Mellow.

## The gates

| Feature | Module | Gate (must clear first) | Depends on |
|---|---|---|---|
| Tokenomics (MUST/veMUST/Serve-to-Earn) | `tokenomics.ts` | **Securities counsel** sign-off before any token contract or reward promise | — |
| DAO governance | `dao.ts` | Depends on Tokenomics; governance liability review | Tokenomics |
| On-chain donations & crowdfunding | `donations.ts` | **KYC/AML** + charitable-solicitation registration | Eternal Vault |
| Eternal Profile (web3 DID) | `eternal-profile.ts` | Privacy review; Phase-5 reputation is the one-way source of truth | — |
| Eternal Vault (wallet/custody) | `eternal-vault.ts` | **Security review** + custody / money-transmitter analysis | — |
| Calling monetization (fees) | `marketplace-monetization.ts` | Payments provider + marketplace-facilitator tax review | — |
| Equipping monetization (payouts) | `marketplace-monetization.ts` | Creator payouts (1099) + content-moderation policy | — |

Each module's header and `DEFERRED_GATES[feature].readyWhen` (in `src/index.ts`)
carry the full definition-of-ready checklist.

## How to un-defer a feature (when cleared)

1. Confirm the feature's `readyWhen` checklist is **fully** satisfied and Will
   has given an explicit written go.
2. Build it as a normal phase (schema → shared → api → web → verify), using
   these interfaces as the starting contract. Money is always `BigInt` minor
   units — never a float.
3. Only then wire real logic in place of the throwing factory, and remove the
   feature from the OFF gate.
