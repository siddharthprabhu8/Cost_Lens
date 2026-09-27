import {
  CostLensAttribution,
  normalizeOpenRouterUsage,
  OpenRouterCompletion,
  UsageRecord,
} from "./usage-record";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type TrackedCompletionInput = {
  model: string;
  messages: OpenRouterMessage[];
  attribution?: CostLensAttribution;
  maxTokens?: number;
  temperature?: number;
};

export type TrackedCompletion = {
  completion: OpenRouterCompletion & Record<string, unknown>;
  usage: UsageRecord;
};

export class OpenRouterError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "OpenRouterError";
  }
}

function apiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new OpenRouterError("OpenRouter is not configured. Add OPENROUTER_API_KEY to .env.local.", 503);
  }
  return key;
}

export async function createTrackedCompletion(input: TrackedCompletionInput): Promise<TrackedCompletion> {
  const startedAt = performance.now();
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      "X-OpenRouter-Title": "CostLens",
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      max_tokens: input.maxTokens,
      temperature: input.temperature,
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null) as (OpenRouterCompletion & Record<string, unknown>) | { error?: { message?: string } } | null;
  if (!response.ok) {
    const message = (payload as { error?: { message?: string } } | null)?.error?.message;
    throw new OpenRouterError(message ?? "OpenRouter request failed.", response.status);
  }

  if (!payload || !("id" in payload) || !("model" in payload)) {
    throw new OpenRouterError("OpenRouter returned an invalid completion.", 502);
  }

  const completion = payload as OpenRouterCompletion & Record<string, unknown>;
  return {
    completion,
    usage: normalizeOpenRouterUsage(completion, Math.round(performance.now() - startedAt), input.attribution),
  };
}

export function isOpenRouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}
