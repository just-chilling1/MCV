import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArmedLink, BlogSite } from "@/features/blog-builder/types";
import { normalizeAffiliateUrl } from "@/features/blog-builder/lib/affiliate-url";
import { buildOfferPageUrl } from "@/lib/app-url";
import { acceleratorTemplateKey, getAcceleratorCatalogEntry } from "./catalog";
import {
  buildAcceleratorSalesPageHtml,
  resolveAcceleratorQuestionnaireCopy,
} from "./accelerator-sales-page";
import { substituteThreadLinkPlaceholder } from "./x-thread-seeds";
import { backfillAcceleratorTemplateImages } from "./seed-templates";
import { slugify } from "@/features/blog-builder/lib/seo";
import {
  THREAD_IMAGE_POST_INDEXES,
  THREAD_POST_ROLES,
} from "@/features/publish-kit/lib/promote-constants";
import { generateThreadImagesForPosts } from "@/features/publish-kit/lib/thread-images";

function newSlug(seed: string): string {
  return `${slugify(seed) || "offer"}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Clone an accelerator template into the member's offers library. */
export async function cloneAcceleratorTemplate(params: {
  db: SupabaseClient;
  userId: string;
  catalogId: number;
  affiliateUrl: string;
  appUrl: string;
}): Promise<{ site: BlogSite; threadsCopied: number }> {
  const { db, userId, catalogId, affiliateUrl, appUrl } = params;
  const url = normalizeAffiliateUrl(affiliateUrl.trim());
  if (!url) throw new Error("Affiliate URL is required");

  const entry = getAcceleratorCatalogEntry(catalogId);
  if (!entry) throw new Error("Template not found in catalog");

  const key = acceleratorTemplateKey(catalogId);
  const { data: templateRows } = await db
    .from("sites")
    .select("*")
    .eq("is_template", true)
    .eq("template_key", key)
    .limit(1);

  const template = (templateRows ?? [])[0] as BlogSite | undefined;
  if (!template?.sales_page_html) {
    throw new Error("This template has not been seeded yet. Contact support.");
  }

  try {
    await backfillAcceleratorTemplateImages(db, catalogId);
  } catch {
    /* preview clone still works with template fallbacks */
  }

  const armedLinks: ArmedLink[] = [
    { label: entry.productName.slice(0, 80), url, network: "digistore" },
  ];

  const slug = newSlug(entry.productSlug);
  const copy = resolveAcceleratorQuestionnaireCopy(entry, template);

  const { data: siteData, error: siteErr } = await db
    .from("sites")
    .insert({
      user_id: userId,
      hobby: entry.nicheLabel,
      territory: entry.productName,
      title: template.title,
      tagline: template.tagline,
      slug,
      theme: template.theme,
      theme_config: (template.theme_config as typeof entry.themeConfig) ?? entry.themeConfig,
      armed_links: armedLinks,
      status: "live",
      site_type: "product",
      is_template: false,
      template_key: key,
      sales_page_json: template.sales_page_json ?? copy,
    })
    .select()
    .single();

  if (siteErr || !siteData) throw new Error(siteErr?.message ?? "Failed to clone template");

  const site = siteData as BlogSite;
  const offerPageUrl = buildOfferPageUrl(appUrl, slug);
  const salesPageHtml = buildAcceleratorSalesPageHtml({
    siteId: site.id,
    entry,
    copy,
    affiliateUrl: url,
    themeConfig: site.theme_config,
  });

  const { error: htmlErr } = await db
    .from("sites")
    .update({ sales_page_html: salesPageHtml })
    .eq("id", site.id);

  if (htmlErr) throw new Error(htmlErr.message);
  site.sales_page_html = salesPageHtml;

  const { data: templateThreads } = await db
    .from("site_x_threads")
    .select("text, angle, image_url")
    .eq("site_id", template.id)
    .order("created_at", { ascending: true });

  let threadsCopied = 0;
  if (templateThreads && templateThreads.length > 0) {
    const posts = templateThreads.map((row, i) => ({
      text: substituteThreadLinkPlaceholder((row as { text: string }).text, offerPageUrl),
      angle:
        (row as { angle: string | null }).angle?.trim() ||
        THREAD_POST_ROLES[i] ||
        `Post ${i + 1}`,
    }));

    let imageResults: (string | null)[] = [];
    try {
      imageResults = await generateThreadImagesForPosts({
        posts,
        postIndexes: THREAD_IMAGE_POST_INDEXES,
        territory: `${entry.nicheLabel} ${entry.productName}`,
        hobby: entry.nicheLabel,
        productName: entry.productName,
        userId,
        supabase: db,
        scrapeUrl: url,
      });
    } catch {
      /* keep template images as fallback */
    }

    const batchId = crypto.randomUUID();
    const rows = posts.map((post, i) => {
      const imageSlot = THREAD_IMAGE_POST_INDEXES.indexOf(
        i as (typeof THREAD_IMAGE_POST_INDEXES)[number]
      );
      const templateImage = (templateThreads[i] as { image_url: string | null }).image_url;
      const regeneratedImage =
        imageSlot >= 0 ? imageResults[imageSlot] ?? null : null;

      return {
        user_id: userId,
        site_id: site.id,
        text: post.text,
        angle: post.angle,
        image_url: regeneratedImage ?? templateImage,
        batch_id: batchId,
      };
    });

    const { error: threadErr } = await db.from("site_x_threads").insert(rows);
    if (threadErr) throw new Error(threadErr.message);
    threadsCopied = rows.length;
  }

  return { site, threadsCopied };
}
