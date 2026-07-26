export type CostLensAttribution = {
  feature?: string;
  customer?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type UsageRecord = {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  cost: number | null;
  status: "success" | "failed";
  attribution: CostLensAttribution;
};

export type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
};

export type OpenRouterCompletion = {
  id: string;
  model: string;
  provider?: string;
  usage?: OpenRouterUsage;
};

function providerFromModel(model: string) {
  const prefix = model.split("/")[0]?.toLowerCase();
  const providers: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    "google-vertex": "Google",
  };

  return providers[prefix ?? ""] ?? prefix ?? "Unknown";
}

export function normalizeOpenRouterUsage(
  completion: OpenRouterCompletion,
  latencyMs: number,
  attribution: CostLensAttribution = {},
): UsageRecord {
  const usage = completion.usage;
  const inputTokens = usage?.prompt_tokens ?? 0;
  const outputTokens = usage?.completion_tokens ?? 0;

  return {
    id: completion.id,
    timestamp: new Date().toISOString(),
    provider: completion.provider ?? providerFromModel(completion.model),
    model: completion.model,
    inputTokens,
    outputTokens,
    totalTokens: usage?.total_tokens ?? inputTokens + outputTokens,
    latencyMs,
    cost: usage?.cost ?? null,
    status: "success",
    attribution,
  };
}
