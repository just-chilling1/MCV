import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { generateWithGPT } from "@/features/blog-builder/lib/ai";
import { parseHeadlinesFromModel } from "@/features/publish-kit/lib/parse-headlines";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = featureApiGuard("article-publish");
  if (guard) return guard;

  const { user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json();
  const { affiliateLink, niche, previousHeadlines = [], productInfo, topic } = body;

  if (!niche) {
    return NextResponse.json({ error: "Niche is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const excludeList =
    previousHeadlines.length > 0
      ? `\n\nDo NOT repeat any of these previously suggested headlines:\n${previousHeadlines.map((h: string, i: number) => `${i + 1}. ${h}`).join("\n")}`
      : "";

  const productContext = productInfo
    ? `\n\nProduct Details (scraped from the affiliate link):
- Product Name: ${productInfo.title || "Unknown"}
- Description: ${productInfo.description || "No description available"}
- Additional Info: ${productInfo.bodySnippet || ""}

IMPORTANT: The headlines MUST be specifically about THIS product. Do NOT make up features or confuse it with other products.`
    : "";

  const userPrompt = `You are an expert content strategist. Generate exactly 5 unique, compelling article headline suggestions for the following:

Niche: ${niche}
${affiliateLink ? `Affiliate/Product Link: ${affiliateLink}` : ""}
${topic ? `Topic: ${topic}` : ""}
${productContext}
${excludeList}

Requirements:
- Each headline should be attention-grabbing and optimized for engagement
- Headlines MUST be specifically relevant to the actual product/service described above
- Each headline should take a different angle or approach (review, comparison, how-to, benefits, guide)
- Make headlines specific and detailed, not generic
- Write headlines in the same language as the product name/description

Respond ONLY with a JSON array of exactly 5 strings (no markdown code fences, no text before or after the array). Example:
["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"]
Never return fewer than 5 headlines.`;

  try {
    const raw = await generateWithGPT(
      "Reply with a JSON array only. No markdown fences.",
      userPrompt,
      { temperature: 0.8, maxRetries: 4 }
    );

    let headlines = parseHeadlinesFromModel(raw)
      .map((h) => h.replace(/^\d+[\.)]\s*/, "").trim())
      .filter((h) => h.length > 5);

    const seen = new Set<string>();
    headlines = headlines.filter((h) => {
      const k = h.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    headlines = headlines.slice(0, 5);

    return NextResponse.json({ headlines }, { headers: NO_STORE_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to suggest headlines";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
