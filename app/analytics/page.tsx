import { CostLensApp } from "../../components/costlens-app";
import { requireSetup } from "../../lib/require-setup";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireSetup();
  return <CostLensApp page="analytics" />;
}
