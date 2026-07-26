import { NextRequest, NextResponse } from "next/server";
import { isOpenRouterConfigured } from "../../../lib/openrouter";
import { canWriteLocalEnvironment, getWorkspaceProfile, saveLocalOpenRouterKey, saveWorkspaceProfile, WorkspaceProfile } from "../../../lib/workspace-store";

export const runtime = "nodejs";

type SetupBody = {
  ownerName?: string;
  organizationName?: string;
  apiKey?: string;
  environment?: WorkspaceProfile["defaults"]["environment"];
  feature?: string;
  customer?: string;
};

function text(value: unknown, maximum = 100) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function GET() {
  try {
    const profile = await getWorkspaceProfile();
    return NextResponse.json({ profile, configured: isOpenRouterConfigured(), canSaveKey: canWriteLocalEnvironment() });
  } catch {
    return NextResponse.json({ error: "Unable to read CostLens setup." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: SetupBody;
  try { body = await request.json() as SetupBody; } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

  const ownerName = text(body.ownerName);
  const organizationName = text(body.organizationName);
  const environment = body.environment ?? "development";
  if (!ownerName || !organizationName) return NextResponse.json({ error: "Your name and organization name are required." }, { status: 400 });
  if (!(["development", "staging", "production"] as string[]).includes(environment)) return NextResponse.json({ error: "Choose a valid environment." }, { status: 400 });

  const apiKey = text(body.apiKey, 500);
  if (apiKey && !/^sk-or-[A-Za-z0-9._-]+$/.test(apiKey)) return NextResponse.json({ error: "That does not look like an OpenRouter API key." }, { status: 400 });
  if (apiKey && !canWriteLocalEnvironment()) return NextResponse.json({ error: "Set OPENROUTER_API_KEY in your hosting provider's environment settings, then return to setup." }, { status: 409 });

  try {
    if (apiKey) await saveLocalOpenRouterKey(apiKey);
    const current = await getWorkspaceProfile();
    const now = new Date().toISOString();
    const profile: WorkspaceProfile = {
      ownerName,
      organizationName,
      defaults: { environment, feature: text(body.feature), customer: text(body.customer) },
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    await saveWorkspaceProfile(profile);
    return NextResponse.json({ profile, configured: isOpenRouterConfigured(), restartRecommended: Boolean(apiKey) });
  } catch {
    return NextResponse.json({ error: "Unable to save CostLens setup. Check that this installation can write local files." }, { status: 500 });
  }
}
