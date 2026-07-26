import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type WorkspaceProfile = {
  ownerName: string;
  organizationName: string;
  defaults: {
    environment: "development" | "staging" | "production";
    feature?: string;
    customer?: string;
  };
  createdAt: string;
  updatedAt: string;
};

const dataDirectory = path.join(process.cwd(), "data", ".ledger");
const profilePath = path.join(dataDirectory, "workspace.json");

function isProfile(value: unknown): value is WorkspaceProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<WorkspaceProfile>;
  return typeof profile.ownerName === "string" && typeof profile.organizationName === "string" && Boolean(profile.defaults);
}

export async function getWorkspaceProfile(): Promise<WorkspaceProfile | null> {
  try {
    const value = JSON.parse(await readFile(profilePath, "utf8")) as unknown;
    return isProfile(value) ? value : null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("CostLens could not read the workspace profile.");
  }
}

export async function saveWorkspaceProfile(profile: WorkspaceProfile): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryPath = `${profilePath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  await rename(temporaryPath, profilePath);
}

export function canWriteLocalEnvironment() {
  return process.env.NODE_ENV !== "production";
}

export async function saveLocalOpenRouterKey(apiKey: string): Promise<void> {
  if (!canWriteLocalEnvironment()) throw new Error("This deployment cannot write environment files.");
  if (/[\r\n]/.test(apiKey)) throw new Error("The API key cannot contain line breaks.");

  const environmentPath = path.join(process.cwd(), ".env.local");
  let lines: string[] = [];
  try {
    lines = (await readFile(environmentPath, "utf8")).split(/\r?\n/).filter((line) => !line.startsWith("OPENROUTER_API_KEY="));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const contents = [...lines.filter(Boolean), `OPENROUTER_API_KEY=${apiKey}`, ""].join("\n");
  const temporaryPath = `${environmentPath}.tmp`;
  await writeFile(temporaryPath, contents, "utf8");
  await rename(temporaryPath, environmentPath);
  process.env.OPENROUTER_API_KEY = apiKey;
}
