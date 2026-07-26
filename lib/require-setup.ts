import "server-only";

import { redirect } from "next/navigation";
import { getWorkspaceProfile } from "./workspace-store";

export async function requireSetup() {
  if (!await getWorkspaceProfile()) redirect("/setup");
}
