import { CostLensClient } from "@costlens/client";

const costlens = new CostLensClient(process.env.COSTLENS_URL ?? "http://localhost:3000");

export async function POST(request: Request) {
  const { text, customerId } = await request.json() as { text: string; customerId: string };
  const result = await costlens.complete({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: `Summarize this text:\n\n${text}` }],
    feature: "document-summary",
    customer: customerId,
    metadata: { environment: process.env.NODE_ENV ?? "development" },
  });

  return Response.json({ summary: result.completion, usage: result.usage });
}
