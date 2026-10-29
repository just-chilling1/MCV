import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { isValidAffiliateUrl, normalizeAffiliateUrl } from "@/features/blog-builder/lib/affiliate-url";
import { loadOwnedSite } from "@/features/blog-builder/lib/generation-pipeline";
import { generateCraftArticle } from "@/features/article-wizard/lib/generate-craft-article";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function titleFromContent(hook: string, topic: string): string {
  const plain = hook
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return topic.slice(0, 120) || "Craft article";
  const firstSentence = plain.split(/(?<=[.!?])\s+/)[0] ?? plain;
  return firstSentence.slice(0, 120);
}

/** Done-For-You Profit: one Craft article, saved to My Vault. */
export async function POST(request: Request) {
  const guard = featureApiGuard("premium-dfy-profit");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && !openaiKey) {
    return NextResponse.json(
      { error: "Article generation is not configured." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  const body = await request.json().catch(() => ({}));
  const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
  const productName = typeof body.productName === "string" ? body.productName.trim() : "";
  const nicheLabel = typeof body.niche === "string" ? body.niche.trim() : "";
  const productContext = typeof body.productContext === "string" ? body.productContext : "";
  const rawAffiliate =
    typeof body.affiliateUrl === "string" ? normalizeAffiliateUrl(body.affiliateUrl) : "";

  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const site = await loadOwnedSite(supabase, user.id, siteId);
  if (!site) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const affiliateUrl =
    (isValidAffiliateUrl(rawAffiliate) ? rawAffiliate : null) ||
    (Array.isArray(site.armed_links) &&
    site.armed_links[0] &&
    isValidAffiliateUrl(site.armed_links[0].url)
      ? normalizeAffiliateUrl(site.armed_links[0].url)
      : "");

  const topic =
    productName ||
    site.title ||
    nicheLabel ||
    site.hobby ||
    "Affiliate product guide";

  const productInfo = productContext
    ? {
        title: productName || site.title || "",
        description: productContext.slice(0, 800),
        bodySnippet: productContext.slice(0, 500),
      }
    : null;

  try {
    const generated = await generateCraftArticle({
      topic,
      platforms: ["medium", "linkedin"],
      tone: "authoritative",
      length: "medium",
      affiliateLink: affiliateUrl || undefined,
      niche: nicheLabel || site.hobby || undefined,
      productInfo,
    });

    const title = titleFromContent(generated.hook, topic);

    const { data: article, error: saveError } = await supabase
      .from("articles")
      .insert({
        user_id: user.id,
        title,
        content: generated.fullContent,
        affiliate_link: affiliateUrl || null,
        niche: nicheLabel || site.hobby || null,
        platform: ["medium", "linkedin"],
        tone: "authoritative",
        length: "medium",
        status: "draft",
        hook: generated.hook,
        cta: generated.cta,
      })
      .select()
      .single();

    if (saveError || !article) {
      console.error("[dfy-profit/craft] save failed", saveError);
      return NextResponse.json(
        {
          id: null,
          title,
          hook: generated.hook,
          cta: generated.cta,
          content: generated.fullContent,
          saveWarning: saveError?.message ?? "Article generated but not saved to Vault",
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        id: article.id,
        title: article.title,
        hook: article.hook,
        cta: article.cta,
        content: article.content,
        niche: article.niche,
        affiliate_link: article.affiliate_link,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Craft article generation failed";
    const status = message.includes("could not be formatted") ? 502 : 500;
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS });
  }
}
