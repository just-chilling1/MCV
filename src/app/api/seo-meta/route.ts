import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { generateWithGPT, extractJsonFromText } from "@/features/blog-builder/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = featureApiGuard("article-publish");
  if (guard) return guard;

  const { user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { title, content, platform } = await request.json();

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const excerpt =
    typeof content === "string"
      ? content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800)
      : "";

  const system = "Reply with JSON only. No code fences.";
  const userPrompt = `You are an SEO specialist. Given this article, produce search-optimized metadata.

Title: ${title}
${platform ? `Primary platform: ${platform}` : ""}
Content excerpt: ${excerpt || "(no body — infer from title only)"}

Return ONLY valid JSON with this shape:
{
  "metaTitle": "string, max ~60 chars, compelling",
  "metaDescription": "string, max ~155 chars, includes benefit + soft CTA",
  "keywords": ["5-10 short keyword phrases"],
  "ogTitle": "optional shorter social title or same as metaTitle",
  "ogDescription": "optional social description or same as metaDescription"
}`;

  try {
    const raw = await generateWithGPT(system, userPrompt, { temperature: 0.4, maxRetries: 3 });
    const parsed = extractJsonFromText(raw) as Record<string, unknown> | null;
    if (!parsed) {
      return NextResponse.json({ error: "Failed to parse SEO response" }, { status: 502, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json(
      {
        metaTitle: String(parsed.metaTitle || title),
        metaDescription: String(parsed.metaDescription || ""),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
        ogTitle: parsed.ogTitle != null ? String(parsed.ogTitle) : undefined,
        ogDescription: parsed.ogDescription != null ? String(parsed.ogDescription) : undefined,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
