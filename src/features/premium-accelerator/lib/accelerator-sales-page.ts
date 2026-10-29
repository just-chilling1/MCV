import { buildThemedQuestionnairePage } from "@/features/blog-builder/lib/questionnaire-page-html";
import { buildSeededQuestionnaireCopy } from "@/features/blog-builder/lib/questionnaire-seeds";
import type { QuestionnaireCopy } from "@/features/blog-builder/lib/questionnaire-copy";
import type { BlogSite } from "@/features/blog-builder/types";
import type { AcceleratorCatalogEntry } from "./catalog";
import { ACCELERATOR_LINK_PLACEHOLDER } from "./x-thread-seeds";

/** Shown in accelerator preview for thread CTAs before clone. */
export const ACCELERATOR_PREVIEW_OFFER_SLUG = "your-offer";

export function parseAcceleratorQuestionnaireCopy(raw: unknown): QuestionnaireCopy | null {
  if (!raw || typeof raw !== "object") return null;
  const copy = raw as QuestionnaireCopy;
  if (typeof copy.title !== "string" || !Array.isArray(copy.questions)) return null;
  return copy;
}

export function resolveAcceleratorQuestionnaireCopy(
  entry: AcceleratorCatalogEntry,
  template: Pick<BlogSite, "sales_page_json">
): QuestionnaireCopy {
  const stored = parseAcceleratorQuestionnaireCopy(template.sales_page_json);
  if (stored) return stored;

  const templateDef = entry.template;
  return buildSeededQuestionnaireCopy({
    niche: entry.nicheLabel,
    nicheKey: entry.nicheKey,
    productName: entry.productName,
    copyToneId: templateDef.copyToneId,
  });
}

/** Build sales page HTML with track-click CTAs wired to the member's affiliate link. */
export function buildAcceleratorSalesPageHtml(params: {
  siteId: string;
  entry: AcceleratorCatalogEntry;
  copy: QuestionnaireCopy;
  affiliateUrl: string;
  themeConfig: BlogSite["theme_config"];
  /** Preview before clone — link directly to the affiliate URL (no track-click). */
  previewMode?: boolean;
}): string {
  const affiliateUrl = params.affiliateUrl.trim() || ACCELERATOR_LINK_PLACEHOLDER;

  return buildThemedQuestionnairePage({
    siteId: params.siteId,
    niche: params.entry.nicheLabel,
    productName: params.entry.productName,
    copy: params.copy,
    affiliateUrl,
    themeConfig: params.themeConfig,
    directAffiliateLink: params.previewMode,
  });
}
