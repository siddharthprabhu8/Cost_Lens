import { NextResponse } from "next/server";
import { listUsageRecords } from "../../../../lib/ledger-store";

export const runtime = "nodejs";

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET() {
  try {
    const records = await listUsageRecords(10_000);
    const headers = ["id", "timestamp", "provider", "model", "feature", "customer", "input_tokens", "output_tokens", "total_tokens", "latency_ms", "cost_usd", "status"];
    const rows = records.map((record) => [
      record.id, record.timestamp, record.provider, record.model,
      record.attribution.feature, record.attribution.customer,
      record.inputTokens, record.outputTokens, record.totalTokens,
      record.latencyMs, record.cost, record.status,
    ].map(escapeCsv).join(","));

    return new NextResponse([headers.join(","), ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="costlens-usage.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to export the local usage ledger." }, { status: 500 });
  }
}
