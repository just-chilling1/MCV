import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSeededQuestionnaireCopy } from "@/features/blog-builder/lib/questionnaire-seeds";
import { buildThemedQuestionnairePage } from "@/features/blog-builder/lib/questionnaire-page-html";
import { getReadyTemplateFromConfig } from "@/features/blog-builder/themes";
import type { BlogSite } from "@/features/blog-builder/types";
import { THREAD_IMAGE_POST_INDEXES } from "@/features/publish-kit/lib/promote-constants";
import { generateThreadImagesForPosts } from "@/features/publish-kit/lib/thread-images";
import {
  acceleratorTemplateKey,
  buildAcceleratorCatalog,
  getAcceleratorCatalogEntry,
  type AcceleratorCatalogEntry,
} from "./catalog";
import {
  ACCELERATOR_LINK_PLACEHOLDER,
  isAcceleratorThreadCorrupted,
  type AcceleratorThreadSeedRow,
} from "./x-thread-seeds";
import { generateAcceleratorXThreadRows } from "./generate-accelerator-thread";

function newSlug(seed: string): string {
  return `${seed}-${crypto.randomUUID().slice(0, 8)}`;
}

interface SeededTemplateState {
  site: BlogSite;
  threadCount: number;
  imagesReady: boolean;
  threadsCorrupted: boolean;
}

async function loadSeededTemplate(
  admin: SupabaseClient,
  catalogId: number
): Promise<SeededTemplateState | null> {
  const key = acceleratorTemplateKey(catalogId);
  const { data: sites } = await admin
    .from("sites")
    .select("*")
    .eq("is_template", true)
    .eq("template_key", key)
    .limit(1);

  const site = (sites ?? [])[0] as BlogSite | undefined;
  if (!site) return null;

  const { data: threads } = await admin
    .from("site_x_threads")
    .select("text, angle, image_url")
    .eq("site_id", site.id)
    .order("created_at", { ascending: true });

  const rows = threads ?? [];
  const imagesReady = THREAD_IMAGE_POST_INDEXES.every(
    (index) => Boolean(rows[index]?.image_url)
  );
  const threadsCorrupted =
    rows.length >= 10 && isAcceleratorThreadCorrupted(rows as { text: string }[]);

  return { site, threadCount: rows.length, imagesReady, threadsCorrupted };
}

function buildSalesPageForTemplate(entry: AcceleratorCatalogEntry, siteId: string) {
  const template = getReadyTemplateFromConfig(entry.themeConfig);
  const copy = buildSeededQuestionnaireCopy({
    niche: entry.nicheLabel,
    nicheKey: entry.nicheKey,
    productName: entry.productName,
    copyToneId: template.copyToneId,
  });

  const salesPageHtml = buildThemedQuestionnairePage({
    siteId,
    niche: entry.nicheLabel,
    productName: entry.productName,
    copy,
    affiliateUrl: ACCELERATOR_LINK_PLACEHOLDER,
    themeConfig: entry.themeConfig,
  });

  return { copy, salesPageHtml };
}

function getTemplateOwnerId(): string {
  const ownerId = process.env.TEMPLATE_OWNER_ID?.trim();
  if (!ownerId) {
    throw new Error("TEMPLATE_OWNER_ID env is not set (must be a real Supabase user id).");
  }
  return ownerId;
}

async function attachAcceleratorThreadImages(params: {
  admin: SupabaseClient;
  ownerId: string;
  entry: AcceleratorCatalogEntry;
  threadRows: AcceleratorThreadSeedRow[];
  scrapeUrl?: string;
}): Promise<(AcceleratorThreadSeedRow & { image_url: string | null })[]> {
  const imageResults = await generateThreadImagesForPosts({
    posts: params.threadRows.map((row) => ({ text: row.text, angle: row.angle })),
    postIndexes: THREAD_IMAGE_POST_INDEXES,
    territory: `${params.entry.nicheLabel} ${params.entry.productName}`,
    hobby: params.entry.nicheLabel,
    productName: params.entry.productName,
    userId: params.ownerId,
    supabase: params.admin,
    scrapeUrl: params.scrapeUrl,
  });

  return params.threadRows.map((row, index) => {
    const imageSlot = THREAD_IMAGE_POST_INDEXES.indexOf(
      index as (typeof THREAD_IMAGE_POST_INDEXES)[number]
    );
    return {
      ...row,
      image_url: imageSlot >= 0 ? imageResults[imageSlot] ?? null : null,
    };
  });
}

/** Backfill niche images on posts 1, 4, and 7 when thread rows exist but image_url is null. */
export async function backfillAcceleratorTemplateImages(
  admin: SupabaseClient,
  catalogId: number
): Promise<{ backfilled: boolean; siteId?: string }> {
  const entry = getAcceleratorCatalogEntry(catalogId);
  if (!entry) throw new Error("Template not found in catalog");

  const existing = await loadSeededTemplate(admin, catalogId);
  if (!existing || existing.threadCount < 10 || existing.imagesReady) {
    return { backfilled: false, siteId: existing?.site.id };
  }

  const ownerId = existing.site.user_id;
  if (!ownerId) throw new Error("Template owner is missing on seeded site.");
  const existingThreads =
    (await admin
      .from("site_x_threads")
      .select("id, text, angle, image_url")
      .eq("site_id", existing.site.id)
      .order("created_at", { ascending: true })).data ?? [];

  const threadRows = existingThreads.map((row) => ({
    text: (row as { text: string }).text,
    angle: (row as { angle: string | null }).angle ?? "Post",
  }));

  const rowsWithImages = await attachAcceleratorThreadImages({
    admin,
    ownerId,
    entry,
    threadRows,
  });

  for (let i = 0; i < existingThreads.length; i++) {
    const imageSlot = THREAD_IMAGE_POST_INDEXES.indexOf(
      i as (typeof THREAD_IMAGE_POST_INDEXES)[number]
    );
    const imageUrl = imageSlot >= 0 ? rowsWithImages[i]?.image_url ?? null : null;
    if (!imageUrl) continue;

    const { error } = await admin
      .from("site_x_threads")
      .update({ image_url: imageUrl })
      .eq("id", (existingThreads[i] as { id: string }).id);
    if (error) throw new Error(error.message);
  }

  return { backfilled: true, siteId: existing.site.id };
}

/** Seed one accelerator template (idempotent — skips if already complete). */
export async function seedAcceleratorTemplate(
  admin: SupabaseClient,
  entry: AcceleratorCatalogEntry,
  options?: { force?: boolean }
): Promise<{ skipped: boolean; siteId: string }> {
  const force = options?.force === true;

  const existing = await loadSeededTemplate(admin, entry.id);
  const threadsComplete =
    !force &&
    existing &&
    existing.site.sales_page_html &&
    existing.threadCount >= 10 &&
    existing.imagesReady &&
    !existing.threadsCorrupted;

  if (threadsComplete) {
    return { skipped: true, siteId: existing.site.id };
  }

  const needsImagesOnly =
    !force &&
    existing &&
    existing.threadCount >= 10 &&
    !existing.imagesReady;

  if (needsImagesOnly) {
    const result = await backfillAcceleratorTemplateImages(admin, entry.id);
    return { skipped: !result.backfilled, siteId: result.siteId ?? existing.site.id };
  }

  const ownerId = getTemplateOwnerId();

  let site = existing?.site ?? null;
  const { copy, salesPageHtml } = buildSalesPageForTemplate(
    entry,
    site?.id ?? crypto.randomUUID()
  );

  if (!site) {
    const slug = newSlug(entry.productSlug);
    const { data, error } = await admin
      .from("sites")
      .insert({
        user_id: ownerId,
        hobby: entry.nicheLabel,
        territory: entry.productName,
        title: copy.title,
        tagline: copy.subtitle.slice(0, 160),
        slug,
        theme: entry.template.presetId,
        theme_config: entry.themeConfig,
        armed_links: [],
        status: "live",
        site_type: "product",
        is_template: true,
        template_key: acceleratorTemplateKey(entry.id),
        sales_page_html: salesPageHtml,
        sales_page_json: copy,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    site = data as BlogSite;
  } else if (!site.sales_page_html) {
    const { error } = await admin
      .from("sites")
      .update({
        title: copy.title,
        tagline: copy.subtitle.slice(0, 160),
        sales_page_html: salesPageHtml,
        sales_page_json: copy,
        theme_config: entry.themeConfig,
        status: "live",
      })
      .eq("id", site.id);

    if (error) throw new Error(error.message);
  }

  const existingThreads =
    (await admin
      .from("site_x_threads")
      .select("id, text, angle, image_url")
      .eq("site_id", site!.id)
      .order("created_at", { ascending: true })).data ?? [];

  const needsNewThreads =
    force ||
    !existing ||
    existingThreads.length < 10 ||
    existing?.threadsCorrupted === true;

  if (needsNewThreads) {
    await admin.from("site_x_threads").delete().eq("site_id", site!.id);

    const threadRows = await generateAcceleratorXThreadRows({
      entry,
      copy,
    });

    const rowsWithImages = await attachAcceleratorThreadImages({
      admin,
      ownerId,
      entry,
      threadRows,
    });

    const batchId = crypto.randomUUID();
    const rows = rowsWithImages.map((thread) => ({
      user_id: ownerId,
      site_id: site!.id,
      text: thread.text,
      angle: thread.angle,
      image_url: thread.image_url,
      batch_id: batchId,
    }));

    const { error: threadErr } = await admin.from("site_x_threads").insert(rows);
    if (threadErr) throw new Error(threadErr.message);
  }

  return { skipped: false, siteId: site!.id };
}

export interface SeedBatchResult {
  seeded: number;
  skipped: number;
  total: number;
  complete: boolean;
}

/** Seed a batch of accelerator templates — run once via admin script/API. */
export async function seedAcceleratorBatch(
  admin: SupabaseClient,
  offset = 0,
  limit = 25,
  options?: { force?: boolean }
): Promise<SeedBatchResult> {
  const catalog = buildAcceleratorCatalog();
  const slice = catalog.slice(offset, offset + limit);
  let seeded = 0;
  let skipped = 0;

  for (const entry of slice) {
    const result = await seedAcceleratorTemplate(admin, entry, options);
    if (result.skipped) skipped++;
    else seeded++;
  }

  const processed = offset + slice.length;
  return {
    seeded,
    skipped,
    total: catalog.length,
    complete: processed >= catalog.length,
  };
}

/** Count how many accelerator templates exist in DB. */
export async function countSeededAcceleratorTemplates(admin: SupabaseClient): Promise<number> {
  const { count } = await admin
    .from("sites")
    .select("id", { count: "exact", head: true })
    .eq("is_template", true)
    .like("template_key", "accelerator-%");

  return count ?? 0;
}
