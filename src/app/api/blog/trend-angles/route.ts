import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { fetchTrendingAngles } from "@/features/blog-builder/lib/trends";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** One-time niche trend angles for a deploy cluster (shared across all posts). */
export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const territory = typeof body.territory === "string" ? body.territory.slice(0, 200) : "";
  const hobby = typeof body.hobby === "string" ? body.hobby.slice(0, 200) : "";

  const trendContext = await fetchTrendingAngles(territory, hobby);
  return NextResponse.json({ trendContext });
}
