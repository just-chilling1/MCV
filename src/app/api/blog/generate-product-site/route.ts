import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser, getServiceRoleClient } from "@/lib/api-auth";
import { generateProductSite } from "@/features/blog-builder/lib/product-generation";
import { scrapePageWithCache } from "@/features/blog-builder/lib/scrape-cache";
import type { ArmedLink, ThemeConfig } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const siteId = typeof body.siteId === "string" ? body.siteId : "";
  const niche = typeof body.niche === "string" ? body.niche.trim() : "";
  const productContext = typeof body.productContext === "string" ? body.productContext : "";
  const scrapedTitle = typeof body.scrapedTitle === "string" ? body.scrapedTitle : undefined;
  const scrapedDescription =
    typeof body.scrapedDescription === "string" ? body.scrapedDescription : undefined;
  const armedLinks = Array.isArray(body.armedLinks) ? (body.armedLinks as ArmedLink[]) : [];
  const themeConfig =
    body.themeConfig && typeof body.themeConfig === "object"
      ? (body.themeConfig as ThemeConfig)
      : null;

  if (!siteId) return NextResponse.json({ error: "siteId is required" }, { status: 400 });
  if (!niche) return NextResponse.json({ error: "niche is required" }, { status: 400 });

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, title, armed_links, theme_config, sales_page_html")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (siteError || !site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  if (site.sales_page_html) {
    return NextResponse.json({
      site,
      alreadyGenerated: true,
      productName: site.title,
    });
  }

  const links =
    armedLinks.length > 0 ? armedLinks : ((site.armed_links ?? []) as ArmedLink[]);
  const config = themeConfig ?? (site.theme_config as ThemeConfig | null);

  let resolvedContext = productContext;
  let resolvedTitle = scrapedTitle;
  let resolvedDescription = scrapedDescription;

  const affiliateUrl = links[0]?.url?.trim();
  if (!resolvedContext && affiliateUrl) {
    const admin = getServiceRoleClient();
    const scraped = await scrapePageWithCache(affiliateUrl, admin);
    resolvedContext = scraped.context;
    resolvedTitle = resolvedTitle ?? scraped.data?.title;
    resolvedDescription = resolvedDescription ?? scraped.data?.description;
  }

  try {
    const result = await generateProductSite({
      supabase,
      userId: user.id,
      siteId,
      niche,
      armedLinks: links,
      themeConfig: config,
      productContext: resolvedContext,
      scrapedTitle: resolvedTitle,
      scrapedDescription: resolvedDescription,
    });

    return NextResponse.json({
      site: result.site,
      productName: result.productName,
      generated: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Product site generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
