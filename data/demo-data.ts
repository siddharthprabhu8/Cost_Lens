import type { UsageRecord } from "../lib/usage-record";

export type DemoSession = { email: string; seed: number; generatedAt: string; updates?: { at: string; seed: number }[] };

// Illustrative prices and fictional customers: never used for live accounting.
const models = [
  { model: "anthropic/claude-sonnet-4", provider: "Anthropic", input: 3, output: 15 },
  { model: "openai/gpt-4o", provider: "OpenAI", input: 2.5, output: 10 },
  { model: "openai/gpt-4o-mini", provider: "OpenAI", input: 0.15, output: 0.6 },
  { model: "google/gemini-2.5-flash", provider: "Google", input: 0.3, output: 2.5 },
];
const features = ["Support copilot", "Document summary", "Data extraction", "Research assistant", "Content studio"];
const customers = ["Arcade Labs", "Meridian", "Northstar", "Acme Health", "Orbit Studio", "Layerworks"];

export function generateDemoRecords(session: DemoSession): UsageRecord[] {
  let state = session.seed >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const now = new Date(session.generatedAt);
  const records: UsageRecord[] = [];
  for (let day = 0; day < 365; day++) {
    const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day);
    const weekday = new Date(start).getUTCDay();
    const volume = Math.round((65 + random() * 70) * (weekday === 0 || weekday === 6 ? 0.55 : 1) * (1 - day / 650));
    const availableMs = day === 0 ? Math.max(1, now.getTime() - start) : 86_400_000;
    for (let index = 0; index < volume; index++) {
      const featureIndex = Math.floor(random() * features.length);
      const model = models[featureIndex === 2 ? 2 : Math.floor(random() * models.length)];
      const failed = random() < 0.024;
      const inputTokens = failed ? 0 : Math.round(800 + random() * (featureIndex === 1 ? 26000 : 9500));
      const outputTokens = failed ? 0 : Math.round(120 + random() * 2300);
      records.push({
        id: `req-${session.seed.toString(36)}-${day.toString(36)}-${index.toString(36)}`,
        timestamp: new Date(start + Math.floor(random() * availableMs)).toISOString(),
        provider: model.provider, model: model.model,
        inputTokens, outputTokens, totalTokens: inputTokens + outputTokens,
        latencyMs: failed ? Math.round(200 + random() * 600) : Math.round(380 + outputTokens * (0.7 + random())),
        cost: failed ? null : Number(((inputTokens * model.input + outputTokens * model.output) / 1_000_000).toFixed(6)),
        status: failed ? "failed" : "success",
        attribution: {
          feature: features[featureIndex], customer: customers[Math.floor(random() ** 1.6 * customers.length)],
          metadata: { environment: random() < 0.93 ? "production" : "staging", region: "us-east-1", source: "gateway" },
        },
      });
    }
  }
  const activity = (session.updates ?? []).flatMap(update => simulateActivity(records, new Date(update.at), update.seed));
  return [...activity, ...records].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/** Adds reproducible activity without rewriting historical records. Browser-only. */
export function simulateActivity(records: UsageRecord[], now: Date, seed: number): UsageRecord[] {
  if (!records.length) return [];
  let state = seed >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  return Array.from({ length: 3 + Math.floor(random() * 6) }, (_, index) => {
    const source = records[Math.floor(random() * records.length)];
    const model = models.find(model => model.model === source.model) ?? models[0];
    const failed = random() < 0.024;
    const inputTokens = failed ? 0 : Math.round(800 + random() * 9500);
    const outputTokens = failed ? 0 : Math.round(120 + random() * 2300);
    return {
      ...source,
      id: `req-${now.getTime().toString(36)}-${seed.toString(36)}-${index}`,
      timestamp: new Date(now.getTime() - index * 450).toISOString(),
      inputTokens, outputTokens, totalTokens: inputTokens + outputTokens,
      latencyMs: Math.round(400 + random() * 2200),
      cost: failed ? null : Number(((inputTokens * model.input + outputTokens * model.output) / 1_000_000).toFixed(6)),
      status: failed ? "failed" : "success",
    };
  });
}
