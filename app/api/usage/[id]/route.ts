import { NextResponse } from "next/server";
import { findUsageRecord } from "../../../../lib/ledger-store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await findUsageRecord(id);
    if (!record) return NextResponse.json({ error: "Usage record not found." }, { status: 404 });
    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ error: "Unable to read the local usage ledger." }, { status: 500 });
  }
}
