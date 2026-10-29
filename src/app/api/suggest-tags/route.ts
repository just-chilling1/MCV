import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { generateWithGPT, extractJsonFromText } from "@/features/blog-builder/lib/ai";
import { listXTagsForSite, saveXTagBatch } from "@/features/publish-kit/lib/x-tags-vault";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const TWITTER_FORMAT =
  "X/Twitter hashtags (e.g. #MarketingTips). Suggest 3-5 hashtags only — over-hashtagging hurts reach on X.";

export async function GET(request: Request) {
  const guard = featureApiGuard("article-publish");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const siteId = new URL(request.url).searchParams.get("siteId")?.trim() || "";
  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const saved = await listXTagsForSite(supabase, user.id, siteId);
  const tags = saved.map((row) => ({ tag: row.tag, reason: row.reason || "" }));

  return NextResponse.json({ tags, platform: "twitter" }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const guard = featureApiGuard("article-publish");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
  const platform = typeof body.platform === "string" ? body.platform : "twitter";
  const articleTitle = typeof body.articleTitle === "string" ? body.articleTitle : "";
  const articleContent = typeof body.articleContent === "string" ? body.articleContent : "";
  const niche = typeof body.niche === "string" ? body.niche : "";

  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  if (!articleTitle) {
    return NextResponse.json({ error: "Title is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const contentSnippet = articleContent.replace(/<[^>]+>/g, " ").slice(0, 500);

  const userPrompt = `You are a social media growth expert. Based on the following product/website, suggest the best ${TWITTER_FORMAT}

Title: ${articleTitle}
${niche ? `Niche: ${niche}` : ""}
${contentSnippet ? `Context: ${contentSnippet}` : ""}

Requirements:
- Tags should maximize discoverability and reach on ${platform}
- Include a mix of high-volume and niche-specific tags
- Order by relevance (most important first)
- For each tag, add a brief reason why it's effective (one short sentence)

Respond ONLY with valid JSON in this exact format:
{"tags": [{"tag": "the tag or hashtag", "reason": "why this tag works"}]}`;

  try {
    const raw = await generateWithGPT(
      "Reply with JSON only. No markdown fences.",
      userPrompt,
      { temperature: 0.5, maxRetries: 3 }
    );

    let tags: { tag: string; reason: string }[] = [];
    const parsed = extractJsonFromText(raw) as { tags?: { tag: string; reason: string }[] } | null;
    if (parsed?.tags && Array.isArray(parsed.tags)) {
      tags = parsed.tags.filter((t) => t && typeof t.tag === "string" && t.tag.trim());
    }

    if (tags.length > 0) {
      await saveXTagBatch(supabase, user.id, siteId, tags);
    }

    return NextResponse.json({ tags, platform }, { headers: NO_STORE_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to suggest tags";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
