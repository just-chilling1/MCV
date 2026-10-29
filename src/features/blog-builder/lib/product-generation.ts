import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArmedLink, ThemeConfig } from "../types";
import { getReadyTemplateFromConfig } from "../themes";
import { deriveProductName } from "./product-sales-copy";
import { generateQuestionnaireCopy, type QuestionnaireCopy } from "./questionnaire-copy";
import { resolveNicheKey } from "./questionnaire-seeds";
import { buildThemedQuestionnairePage } from "./questionnaire-page-html";

export interface GenerateProductSiteParams {
  supabase: SupabaseClient;
  userId: string;
  siteId: string;
  niche: string;
  armedLinks: ArmedLink[];
  themeConfig?: ThemeConfig | null;
  productContext?: string;
  scrapedTitle?: string;
  scrapedDescription?: string;
}

export interface GenerateProductSiteResult {
  productName: string;
  salesPageHtml: string;
  salesPageJson: QuestionnaireCopy;
  site: Record<string, unknown>;
}

export async function generateProductSite(
  params: GenerateProductSiteParams
): Promise<GenerateProductSiteResult> {
  const affiliate = params.armedLinks[0];
  if (!affiliate?.url?.trim()) {
    throw new Error("At least one affiliate link is required");
  }

  const productName = deriveProductName({
    niche: params.niche,
    scrapedTitle: params.scrapedTitle,
    affiliateLabel: affiliate.label,
  });

  const template = getReadyTemplateFromConfig(params.themeConfig);

  const copy = await generateQuestionnaireCopy({
    productName,
    niche: params.niche,
    nicheKey: resolveNicheKey(params.niche),
    description: params.scrapedDescription,
    productContext: params.productContext,
    affiliateLabel: affiliate.label,
    copyToneId: template.copyToneId,
    templateId: template.id,
    templateName: template.name,
  });

  const salesPageHtml = buildThemedQuestionnairePage({
    siteId: params.siteId,
    productName,
    niche: params.niche,
    copy,
    affiliateUrl: affiliate.url.trim(),
    themeConfig: params.themeConfig,
  });

  const tagline = copy.subtitle.slice(0, 160);

  const { data: updatedSite, error } = await params.supabase
    .from("sites")
    .update({
      title: copy.title,
      tagline,
      site_type: "product",
      sales_page_html: salesPageHtml,
      sales_page_json: copy,
      theme_config: params.themeConfig ?? {},
    })
    .eq("id", params.siteId)
    .eq("user_id", params.userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return { productName, salesPageHtml, salesPageJson: copy, site: updatedSite };
}
