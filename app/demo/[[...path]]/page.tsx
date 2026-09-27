import { redirect } from "next/navigation";

export default async function DemoRedirect({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  redirect(`/workspace${path.length ? `/${path.map(encodeURIComponent).join("/")}` : ""}`);
}
