import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogSite } from "@/features/blog-builder/types";
import { buildOfferPageUrl } from "@/lib/app-url";
import { acceleratorTemplateKey, getAcceleratorCatalogEntry } from "./catalog";
import {
  ACCELERATOR_PREVIEW_OFFER_SLUG,
  buildAcceleratorSalesPageHtml,
  resolveAcceleratorQuestionnaireCopy,
} from "./accelerator-sales-page";
import { ACCELERATOR_LINK_PLACEHOLDER, substituteThreadLinkPlaceholder } from "./x-thread-seeds";

export interface AcceleratorThreadPreview {
  text: string;
  angle: string | null;
  image_url: string | null;
}

export interface AcceleratorTemplatePreview {
  catalogId: number;
  niche: string;
  productName: string;
  templateName: string;
  title: string;
  tagline: string | null;
  salesPageHtml: string;
  threads: AcceleratorThreadPreview[];
  offerPageUrl: string;
}

/** Load seeded accelerator template content for member preview (no clone). */
export async function loadAcceleratorTemplatePreview(params: {
  db: SupabaseClient;
  catalogId: number;
  affiliateUrl?: string;
  appUrl: string;
}): Promise<AcceleratorTemplatePreview> {
  const { db, catalogId, affiliateUrl, appUrl } = params;
  const entry = getAcceleratorCatalogEntry(catalogId);
  if (!entry) throw new Error("Template not found in catalog");

  const key = acceleratorTemplateKey(catalogId);
  const { data: templateRows } = await db
    .from("sites")
    .select("id, title, tagline, sales_page_html, sales_page_json, theme_config")
    .eq("is_template", true)
    .eq("template_key", key)
    .limit(1);

  const template = (templateRows ?? [])[0] as
    | Pick<BlogSite, "id" | "title" | "tagline" | "sales_page_html" | "sales_page_json" | "theme_config">
    | undefined;
  if (!template?.sales_page_html) {
    throw new Error("This template has not been seeded yet.");
  }

  const { data: templateThreads } = await db
    .from("site_x_threads")
    .select("text, angle, image_url")
    .eq("site_id", template.id)
    .order("created_at", { ascending: true });

  const affiliate = affiliateUrl?.trim() || ACCELERATOR_LINK_PLACEHOLDER;
  const copy = resolveAcceleratorQuestionnaireCopy(entry, template);
  const offerPageUrl = buildOfferPageUrl(appUrl, ACCELERATOR_PREVIEW_OFFER_SLUG);

  return {
    catalogId,
    niche: entry.nicheLabel,
    productName: entry.productName,
    templateName: entry.template.name,
    title: template.title,
    tagline: template.tagline ?? null,
    salesPageHtml: buildAcceleratorSalesPageHtml({
      siteId: template.id,
      entry,
      copy,
      affiliateUrl: affiliate,
      themeConfig: template.theme_config,
      previewMode: true,
    }),
    offerPageUrl,
    threads: (templateThreads ?? []).map((row) => ({
      text: substituteThreadText((row as { text: string }).text, offerPageUrl),
      angle: (row as { angle: string | null }).angle,
      image_url: (row as { image_url: string | null }).image_url,
    })),
  };
}

function substituteThreadText(text: string, offerPageUrl: string): string {
  return substituteThreadLinkPlaceholder(text, offerPageUrl);
}
