import { NextRequest, NextResponse } from "next/server";
import { appendUsageRecord } from "../../../../lib/ledger-store";
import { createTrackedCompletion, OpenRouterError } from "../../../../lib/openrouter";
import { CostLensAttribution, providerFromModel } from "../../../../lib/usage-record";
import type { TrackedCompletion } from "../../../../lib/openrouter";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

type RequestBody = {
  model?: string;
  messages?: Array<{ role?: "system" | "user" | "assistant"; content?: string }>;
  feature?: string;
  customer?: string;
  metadata?: Record<string, string | number | boolean>;
  maxTokens?: number;
  temperature?: number;
};

function attributionFrom(body: RequestBody): CostLensAttribution {
  return {
    feature: body.feature,
    customer: body.customer,
    metadata: body.metadata,
  };
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body.model !== "string" || !body.model.trim() || !Array.isArray(body.messages) || !body.messages.length || body.messages.some((message) => !message || !["system", "user", "assistant"].includes(message.role ?? "") || typeof message.content !== "string" || !message.content)) {
    return NextResponse.json({ error: "model and at least one complete message are required." }, { status: 400 });
  }

  const startedAt = performance.now();
  let result: TrackedCompletion;
  try {
    result = await createTrackedCompletion({
      model: body.model,
      messages: body.messages as Array<{ role: "system" | "user" | "assistant"; content: string }>,
      attribution: attributionFrom(body),
      maxTokens: body.maxTokens,
      temperature: body.temperature,
    });

  } catch (error) {
    const status = error instanceof OpenRouterError ? error.status : 502;
    const message = error instanceof OpenRouterError ? error.message : "Unable to reach OpenRouter.";
    const usage = {
      id: `failed-${randomUUID()}`,
      timestamp: new Date().toISOString(),
      provider: providerFromModel(body.model),
      model: body.model,
      inputTokens: 0, outputTokens: 0, totalTokens: 0,
      latencyMs: Math.round(performance.now() - startedAt),
      cost: null,
      status: "failed" as const,
      attribution: attributionFrom(body),
    };
    try {
      await appendUsageRecord(usage);
    } catch {
      return NextResponse.json({ error: message, usage, persisted: false, persistenceError: "Unable to save the failed request to the usage ledger." }, { status });
    }
    return NextResponse.json({ error: message, usage, persisted: true }, { status });
  }

  // A storage error must never turn a successful provider call into a failed call.
  try {
    await appendUsageRecord(result.usage);
    return NextResponse.json({ ...result, persisted: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ...result, persisted: false, error: "Completion succeeded, but its usage could not be saved." }, { status: 500 });
  }
}
