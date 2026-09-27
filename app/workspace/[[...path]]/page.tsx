import { notFound } from "next/navigation";
import { DemoExperience } from "../../../components/demo-experience";

export default async function WorkspacePage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  if (path.length === 0) return <DemoExperience page="overview" />;
  if (path.length === 1 && (path[0] === "requests" || path[0] === "analytics" || path[0] === "settings")) return <DemoExperience page={path[0]} />;
  if (path.length === 2 && path[0] === "requests") return <DemoExperience page="request-detail" requestId={path[1]} />;
  notFound();
}
