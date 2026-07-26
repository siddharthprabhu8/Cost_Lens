import { NextResponse } from "next/server";
import { isOpenRouterConfigured } from "../../../../lib/openrouter";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ configured: isOpenRouterConfigured() });
}
