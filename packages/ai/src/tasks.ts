import { complete, completeJson } from "./client.js";

// ---------------------------------------------------------------------------
// Domain AI tasks (Phase 6). Pure data in / data out — no DB access here.
// Callers check aiEnabled() first and own their fallbacks; these throw on
// failure rather than degrade silently.
// ---------------------------------------------------------------------------

export interface FeedCandidate {
  id: string;
  authorHandle: string | null;
  followed: boolean; // viewer follows the author
  body: string;
  createdAt: string;
  reactions: number;
  comments: number;
}

/**
 * Agape Algorithm v1 — AI re-rank of the candidate feed window. Returns post
 * ids in display order. The caller (API /feed) falls back to the pure v0
 * ranker if this throws, returns an incomplete set, or the flag is off.
 */
export async function rankFeedAI(candidates: FeedCandidate[]): Promise<string[]> {
  const result = await completeJson<{ orderedIds: string[] }>({
    purpose: "feed_rerank",
    effort: "low",
    maxTokens: 2048,
    system: [
      "You rank a Christian fellowship feed (the \"Agape Algorithm\").",
      "Order posts to nurture genuine fellowship: prioritize posts from people the viewer",
      "follows, recency, and posts that invite prayer, encouragement, or testimony.",
      "De-prioritize low-substance posts, but never exclude any: return EVERY id exactly once.",
    ].join(" "),
    prompt: JSON.stringify({ posts: candidates }),
    schema: {
      type: "object",
      properties: {
        orderedIds: { type: "array", items: { type: "string" } },
      },
      required: ["orderedIds"],
      additionalProperties: false,
    },
  });

  // Guard: the ranker must be a permutation of the input, or we fall back.
  const input = new Set(candidates.map((c) => c.id));
  const output = new Set(result.orderedIds);
  if (output.size !== input.size || ![...input].every((id) => output.has(id))) {
    throw new Error("feed_rerank returned a non-permutation");
  }
  return result.orderedIds;
}

export interface CompanionAssist {
  suggestion: string;
  scriptures: { reference: string; text: string; why: string }[];
}

/**
 * Prayer Companion — compose assist + scripture suggestions. READ-ONLY: the
 * result is shown to the user, who chooses what (if anything) to post. The
 * companion itself never posts.
 */
export async function assistPrayer(draft: string): Promise<CompanionAssist> {
  return completeJson<CompanionAssist>({
    purpose: "companion_assist",
    maxTokens: 1536,
    system: [
      "You are the Prayer Companion for Mellow, a Christian prayer app.",
      "Given a draft prayer request, gently improve its clarity and warmth while fully",
      "preserving the author's voice, situation, and intent — do not embellish facts.",
      "Also suggest 2-3 relevant Bible passages (reference, short quotation, and one",
      "sentence on why it fits). Keep the suggestion under 150 words.",
    ].join(" "),
    prompt: draft,
    schema: {
      type: "object",
      properties: {
        suggestion: { type: "string" },
        scriptures: {
          type: "array",
          items: {
            type: "object",
            properties: {
              reference: { type: "string" },
              text: { type: "string" },
              why: { type: "string" },
            },
            required: ["reference", "text", "why"],
            additionalProperties: false,
          },
        },
      },
      required: ["suggestion", "scriptures"],
      additionalProperties: false,
    },
  });
}

export interface ThreadForSummary {
  title: string | null;
  body: string;
  answered: boolean;
  testimonial: string | null;
  comments: { author: string; body: string }[];
}

/** Prayer Companion — summarize a prayer thread (read-only). */
export async function summarizeThread(thread: ThreadForSummary): Promise<string> {
  return complete({
    purpose: "companion_summary",
    effort: "low",
    maxTokens: 512,
    system: [
      "You are the Prayer Companion for Mellow, a Christian prayer app. Summarize a",
      "prayer thread in 2-3 warm, faithful sentences: the request, how the community",
      "responded, and (if answered) the testimony. Plain text only.",
    ].join(" "),
    prompt: JSON.stringify(thread),
  });
}
