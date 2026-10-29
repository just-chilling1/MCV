import { generateWithGPT, extractJsonFromText } from "@/features/blog-builder/lib/ai";
import { scrapePageWithCache } from "@/features/blog-builder/lib/scrape-cache";
import { buildSitePromoteContext } from "@/features/publish-kit/lib/site-context";
import {
  buildFacebookPostSystemPrompt,
  buildFacebookPostUserPrompt,
  FACEBOOK_POST_COUNT,
  parseFacebookPostResponse,
  parseFacebookPostStrings,
} from "@/features/publish-kit/lib/facebook-post-rules";
import type { BlogSite } from "@/features/blog-builder/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface GenerateFacebookPostsParams {
  site: BlogSite;
  promoLink: string;
  postCount?: number;
  /** Keep staged flows within their API route deadline. */
  timeoutMs?: number;
  /** Limit retries when follow-up work must finish in the same API route. */
  maxRetries?: number;
  /** Optional service-role client for affiliate page scraping. */
  scrapeClient?: SupabaseClient | null;
}

export async function generateFacebookPostsForOffer(
  params: GenerateFacebookPostsParams
): Promise<string[]> {
  const { site, promoLink, scrapeClient } = params;
  const postCount = params.postCount ?? FACEBOOK_POST_COUNT;

  const affiliateUrl = site.armed_links?.[0]?.url?.trim() || "";
  let scrapedProductContext = "";

  if (affiliateUrl && scrapeClient) {
    try {
      const { context } = await scrapePageWithCache(affiliateUrl, scrapeClient);
      scrapedProductContext = context || "";
    } catch {
      /* continue without scrape */
    }
  }

  const context = buildSitePromoteContext({
    site,
    siteUrl: promoLink,
    scrapedProductContext,
  });

  const system = buildFacebookPostSystemPrompt();
  const userPrompt = buildFacebookPostUserPrompt({
    fullContext: context.fullContext,
    postCount,
  });

  const raw = await generateWithGPT(system, userPrompt, {
    temperature: 0.82,
    maxRetries: params.maxRetries ?? 4,
    timeoutMs: params.timeoutMs ?? 120_000,
  });

  const parsed = extractJsonFromText(raw);
  let posts = parseFacebookPostResponse(parsed, postCount);

  if (posts.length === 0 && parsed && typeof parsed === "object" && "posts" in parsed) {
    const fallbackPosts = (parsed as { posts?: unknown }).posts;
    if (Array.isArray(fallbackPosts)) {
      posts = parseFacebookPostStrings(fallbackPosts, postCount);
    }
  }

  if (posts.length === 0) {
    throw new Error("Generator returned no posts. Try again.");
  }

  return posts.map((p) => p.text.replace(/\[LINK\]/g, promoLink));
}
