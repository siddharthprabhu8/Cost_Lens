import { NextRequest, NextResponse } from "next/server";
import { listUsageRecords } from "../../../lib/ledger-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 100;

  try {
    const records = await listUsageRecords(limit);
    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ error: "Unable to read the local usage ledger." }, { status: 500 });
  }
}
