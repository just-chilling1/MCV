import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { generateWithGPT } from "@/features/blog-builder/lib/ai";
import { parseHeadlinesFromModel } from "@/features/publish-kit/lib/parse-headlines";
import {
  fallbackSuggestedTone,
  parseSuggestedTone,
} from "@/features/article-wizard/lib/parse-suggested-tone";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = featureApiGuard("article-publish");
  if (guard) return guard;

  const { user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json();
  const {
    affiliateLink,
    niche,
    previousHeadlines = [],
    productInfo,
    topic,
    suggestTone,
  } = body;

  if (!niche) {
    return NextResponse.json({ error: "Niche is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const productLine = productInfo
    ? `Product: ${productInfo.title || "Unknown"}. ${productInfo.description || ""}`.slice(0, 280)
    : "";

  try {
    if (suggestTone) {
      try {
        const raw = await generateWithGPT(
          'Return ONLY JSON like {"tone":"authoritative","reason":"short why"}. tone must be one of: authoritative, conversational, bold.',
          `Niche: ${niche}${topic ? `\nTopic: ${topic}` : ""}${productLine ? `\n${productLine}` : ""}\nPick the best writing tone.`,
          { temperature: 0.2, maxRetries: 2, maxTokens: 200, timeoutMs: 25_000 }
        );

        const toneResult = parseSuggestedTone(raw) ?? fallbackSuggestedTone(niche, topic || "");
        return NextResponse.json(toneResult, { headers: NO_STORE_HEADERS });
      } catch (toneErr) {
        console.error("[suggest-headlines] tone AI failed, using fallback", toneErr);
        return NextResponse.json(fallbackSuggestedTone(niche, topic || ""), {
          headers: NO_STORE_HEADERS,
        });
      }
    }

    const excludeList =
      previousHeadlines.length > 0
        ? `\nAvoid repeating:\n${previousHeadlines
            .slice(-10)
            .map((h: string, i: number) => `${i + 1}. ${h}`)
            .join("\n")}`
        : "";

    const userPrompt = `Generate exactly 5 unique article headlines.
Niche: ${niche}
${affiliateLink ? `Link: ${affiliateLink}` : ""}
${topic ? `Topic hint: ${topic}` : ""}
${productLine}
${excludeList}

Vary angles (review, how-to, benefits, comparison, guide). Match the product language.
Reply with a JSON array of exactly 5 strings only.`;

    const raw = await generateWithGPT("JSON array of 5 headline strings only. No markdown.", userPrompt, {
      temperature: 0.7,
      maxRetries: 2,
      maxTokens: 400,
      timeoutMs: 25_000,
    });

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
