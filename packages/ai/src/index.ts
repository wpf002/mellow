// The single AI adapter for Mellow — all AI calls go through this package.
// Claude via the official Anthropic SDK; model pinned in client.ts.
export * from "./client.js";
export * from "./tasks.js";
