import { NextRequest, NextResponse } from "next/server";
import { appendUsageRecord } from "../../../../lib/ledger-store";
import { createTrackedCompletion, OpenRouterError } from "../../../../lib/openrouter";
import { CostLensAttribution } from "../../../../lib/usage-record";

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

  if (!body.model || !body.messages?.length || body.messages.some((message) => !message.role || !message.content)) {
    return NextResponse.json({ error: "model and at least one complete message are required." }, { status: 400 });
  }

  try {
    const result = await createTrackedCompletion({
      model: body.model,
      messages: body.messages as Array<{ role: "system" | "user" | "assistant"; content: string }>,
      attribution: attributionFrom(body),
      maxTokens: body.maxTokens,
      temperature: body.temperature,
    });

    await appendUsageRecord(result.usage);
    return NextResponse.json({ ...result, persisted: true }, { status: 201 });
  } catch (error) {
    if (error instanceof OpenRouterError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to reach OpenRouter." }, { status: 502 });
  }
}
