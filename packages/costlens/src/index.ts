export type CostLensMetadata = Record<string, string | number | boolean>;

export type CostLensMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CompletionInput = {
  model: string;
  messages: CostLensMessage[];
  feature?: string;
  customer?: string;
  metadata?: CostLensMetadata;
  maxTokens?: number;
  temperature?: number;
};

export type CostLensUsage = {
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
  attribution: {
    feature?: string;
    customer?: string;
    metadata?: CostLensMetadata;
  };
};

export type CompletionResult = {
  completion: Record<string, unknown>;
  usage: CostLensUsage;
  persisted: boolean;
};

export class CostLensError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "CostLensError";
  }
}

/**
 * Server-side client for a self-hosted CostLens instance. Keep it in trusted
 * application code: CostLens proxies provider requests and should be protected
 * with your application's existing authentication before public deployment.
 */
export class CostLensClient {
  constructor(private readonly baseUrl: string, private readonly fetcher: typeof fetch = fetch) {}

  async complete(input: CompletionInput): Promise<CompletionResult> {
    const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, "")}/api/openrouter/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await response.json() as CompletionResult | { error?: string };
    if (!response.ok) throw new CostLensError((body as { error?: string }).error ?? "CostLens request failed.", response.status);
    return body as CompletionResult;
  }
}
