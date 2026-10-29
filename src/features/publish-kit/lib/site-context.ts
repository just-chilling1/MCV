import type { BlogSite } from "@/features/blog-builder/types";
import type { ProductSalesCopy } from "@/features/blog-builder/lib/product-sales-copy";
import { getSiteTerritory } from "@/features/blog-builder/lib/site-territory";

export interface SitePromoteContext {
  siteName: string;
  siteUrl: string;
  territory: string;
  tagline: string | null;
  affiliateLink: string | null;
  affiliateLabel: string | null;
  productSummary: string;
  websiteSummary: string;
  /** Combined block passed to the social-post generator. */
  fullContext: string;
}

function salesCopyToSummary(copy: ProductSalesCopy): string {
  const lines: string[] = [];
  if (copy.hook) lines.push(`Hook: ${copy.hook}`);
  if (copy.subhook) lines.push(`Subhook: ${copy.subhook}`);
  if (copy.productIntro) lines.push(`Product intro: ${copy.productIntro}`);
  if (copy.benefits?.length) {
    lines.push(
      `Benefits: ${copy.benefits
        .slice(0, 5)
        .map((b) => `${b.title} — ${b.description}`)
        .join("; ")}`
    );
  }
  if (copy.differentiators?.length) {
    lines.push(`Differentiators: ${copy.differentiators.slice(0, 4).join("; ")}`);
  }
  if (copy.forWho?.length) lines.push(`Ideal for: ${copy.forWho.slice(0, 4).join("; ")}`);
  if (copy.finalCta) lines.push(`CTA angle: ${copy.finalCta}`);
  return lines.join("\n");
}

function parseSalesCopy(raw: Record<string, unknown> | null | undefined): ProductSalesCopy | null {
  if (!raw || typeof raw !== "object") return null;
  const hook = typeof raw.hook === "string" ? raw.hook : "";
  const subhook = typeof raw.subhook === "string" ? raw.subhook : "";
  if (!hook) return null;

  const benefits = Array.isArray(raw.benefits)
    ? raw.benefits
        .filter((b): b is { title: string; description: string } => {
          if (!b || typeof b !== "object") return false;
          const row = b as Record<string, unknown>;
          return typeof row.title === "string" && typeof row.description === "string";
        })
        .slice(0, 6)
    : [];

  return {
    hook,
    subhook,
    problemHeadline: typeof raw.problemHeadline === "string" ? raw.problemHeadline : "",
    problemPoints: [],
    agitation: typeof raw.agitation === "string" ? raw.agitation : "",
    newPerspective: typeof raw.newPerspective === "string" ? raw.newPerspective : "",
    ahaMoment: typeof raw.ahaMoment === "string" ? raw.ahaMoment : "",
    productIntro: typeof raw.productIntro === "string" ? raw.productIntro : "",
    benefits,
    differentiators: Array.isArray(raw.differentiators)
      ? raw.differentiators.filter((d): d is string => typeof d === "string")
      : [],
    forWho: Array.isArray(raw.forWho) ? raw.forWho.filter((d): d is string => typeof d === "string") : [],
    notForWho: [],
    faqs: [],
    guarantee: typeof raw.guarantee === "string" ? raw.guarantee : "",
    contents: [],
    finalCta: typeof raw.finalCta === "string" ? raw.finalCta : "",
    urgency: typeof raw.urgency === "string" ? raw.urgency : "",
  };
}

function htmlToPlainText(html: string, maxLen = 1200): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function buildSitePromoteContext(params: {
  site: BlogSite;
  siteUrl: string;
  scrapedProductContext?: string;
}): SitePromoteContext {
  const { site, siteUrl, scrapedProductContext } = params;
  const territory = getSiteTerritory(site);
  const affiliate = site.armed_links?.[0];
  const affiliateLink = affiliate?.url?.trim() || null;
  const affiliateLabel = affiliate?.label?.trim() || null;

  const salesCopy = parseSalesCopy(site.sales_page_json as Record<string, unknown> | null);
  const salesCopySummary = salesCopy ? salesCopyToSummary(salesCopy) : "";
  const pageExcerpt = site.sales_page_html ? htmlToPlainText(site.sales_page_html) : "";

  const websiteLines = [
    `Website: ${site.title}`,
    site.tagline ? `Tagline: ${site.tagline}` : "",
    `Niche / territory: ${territory}`,
    site.site_type === "product" ? "Site type: product promotion page" : "Site type: content site",
  ].filter(Boolean);

  const productLines = [
    affiliateLabel ? `Offer label: ${affiliateLabel}` : "",
    scrapedProductContext?.trim() || "",
    salesCopySummary,
    !salesCopySummary && pageExcerpt ? `Page copy excerpt: ${pageExcerpt}` : "",
  ].filter(Boolean);

  const productSummary =
    productLines.join("\n").trim() ||
    `A ${territory} offer promoted through ${site.title}.`;

  const websiteSummary = websiteLines.join("\n");

  const fullContext = [
    "=== WEBSITE ===",
    websiteSummary,
    siteUrl ? `Offer page URL (use in CTA): ${siteUrl}` : "",
    "",
    "=== PRODUCT / OFFER ===",
    productSummary,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    siteName: site.title,
    siteUrl,
    territory,
    tagline: site.tagline,
    affiliateLink,
    affiliateLabel,
    productSummary,
    websiteSummary,
    fullContext,
  };
}
