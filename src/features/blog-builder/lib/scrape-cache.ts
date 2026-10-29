import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeAffiliateUrl } from "./affiliate-url";
import { scrapePage, buildProductContext, type ScrapedPageInfo } from "./scrape";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function urlKey(url: string): string {
  return normalizeAffiliateUrl(url).trim().toLowerCase();
}

export interface ScrapeCacheResult {
  data: ScrapedPageInfo | null;
  context: string;
  cached: boolean;
}

/** Scrape an affiliate URL with a shared Supabase cache (7-day TTL). */
export async function scrapePageWithCache(
  url: string,
  supabase: SupabaseClient | null
): Promise<ScrapeCacheResult> {
  const key = urlKey(url);
  if (!key) return { data: null, context: "", cached: false };

  if (supabase) {
    const { data: row } = await supabase
      .from("affiliate_scrape_cache")
      .select("scraped_data, context, fetched_at")
      .eq("url_key", key)
      .maybeSingle();

    if (row?.fetched_at) {
      const age = Date.now() - new Date(row.fetched_at as string).getTime();
      if (age < CACHE_TTL_MS && row.context) {
        const scraped = row.scraped_data as ScrapedPageInfo | null;
        return {
          data: scraped?.title ? scraped : null,
          context: String(row.context),
          cached: true,
        };
      }
    }
  }

  const data = await scrapePage(url);
  const context = data ? buildProductContext(data) : "";

  if (supabase && context) {
    await supabase.from("affiliate_scrape_cache").upsert(
      {
        url_key: key,
        source_url: url,
        scraped_data: data ?? {},
        context,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "url_key" }
    );
  }

  return { data, context, cached: false };
}
