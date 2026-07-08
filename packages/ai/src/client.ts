import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// The single Claude adapter for Mellow (Phase 6). Every AI call in the app
// goes through this package. The model is pinned in ONE place and swappable.
// ---------------------------------------------------------------------------

export const DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL ?? "claude-opus-4-8";

/**
 * Feature flag for the whole AI layer. Enabled when an Anthropic API key is
 * configured and AI_FEATURES isn't explicitly off. Callers must degrade
 * gracefully when disabled (feed falls back to the v0 ranker; companion
 * endpoints return 503 and the web hides the UI).
 */
export function aiEnabled(): boolean {
  const off = ["false", "0", "off"].includes((process.env.AI_FEATURES ?? "").toLowerCase());
  return Boolean(process.env.ANTHROPIC_API_KEY) && !off;
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  // Lazy: only constructed when a call is actually made (flag checked upstream).
  if (!_client) _client = new Anthropic();
  return _client;
}

export interface CompleteOptions {
  /** Which feature is calling — recorded in the usage log. */
  purpose: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
  /** JSON Schema; when set the response is constrained to it and parsed. */
  schema?: Record<string, unknown>;
}

/**
 * One-shot completion against the pinned model, with token usage logged on
 * every call. Returns the text (or throws — callers own their fallback).
 */
export async function complete(opts: CompleteOptions): Promise<string> {
  const outputConfig = {
    ...(opts.effort ? { effort: opts.effort } : {}),
    ...(opts.schema ? { format: { type: "json_schema" as const, schema: opts.schema } } : {}),
  };

  const response = await client().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    thinking: { type: "adaptive" },
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
    ...(Object.keys(outputConfig).length > 0 ? { output_config: outputConfig } : {}),
  });

  // Log token usage on every AI call (plan invariant).
  console.log(
    JSON.stringify({
      ai_usage: {
        purpose: opts.purpose,
        model: DEFAULT_MODEL,
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        stop_reason: response.stop_reason,
      },
    }),
  );

  if (response.stop_reason === "refusal") {
    throw new Error(`AI refused (${opts.purpose})`);
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  if (!text) throw new Error(`AI returned no text (${opts.purpose})`);
  return text;
}

/** complete() + JSON.parse for schema-constrained calls. */
export async function completeJson<T>(opts: CompleteOptions & { schema: Record<string, unknown> }): Promise<T> {
  return JSON.parse(await complete(opts)) as T;
}
