import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { suggestTerritories } from "@/features/blog-builder/lib/generate-content";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const hobby = typeof body.hobby === "string" ? body.hobby.trim() : "";
  if (!hobby) return NextResponse.json({ error: "hobby is required" }, { status: 400 });

  const suggestions = await suggestTerritories(hobby);
  return NextResponse.json({ suggestions });
}
