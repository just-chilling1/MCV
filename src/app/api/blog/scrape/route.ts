import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser, getServiceRoleClient } from "@/lib/api-auth";
import { scrapePageWithCache } from "@/features/blog-builder/lib/scrape-cache";
import { assertPublicHttpsUrlResolved } from "@/lib/safe-url";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  let safeUrl: string;
  try {
    safeUrl = (await assertPublicHttpsUrlResolved(url)).toString();
  } catch {
    return NextResponse.json({ error: "Only public https URLs can be scraped" }, { status: 400 });
  }

  const admin = getServiceRoleClient();
  const { data, context, cached } = await scrapePageWithCache(safeUrl, admin);
  return NextResponse.json({ data, context, cached });
}
