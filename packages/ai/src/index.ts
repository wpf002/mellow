// Thin wrapper over Flint. The model is pinned in ONE place and swappable.
export const DEFAULT_MODEL = process.env.FLINT_DEFAULT_MODEL ?? "claude-sonnet-4-6";

// TODO(phase 6): wire the @flint client here. All AI calls go through this package.
