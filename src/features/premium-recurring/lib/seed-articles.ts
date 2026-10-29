import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildRecurringStreamCatalog,
  RECURRING_STREAM_NICHES,
  RECURRING_STREAM_TARGET_COUNT,
} from "./catalog";

export async function countSeededRecurringArticles(admin: SupabaseClient): Promise<number> {
  const { count } = await admin
    .from("premium_article_templates")
    .select("id", { count: "exact", head: true })
    .like("template_key", "recurring-stream-%");

  return count ?? 0;
}

async function countSeededNiches(admin: SupabaseClient): Promise<number> {
  const { data, error } = await admin
    .from("premium_article_templates")
    .select("niche")
    .like("template_key", "recurring-stream-%");

  if (error) return 0;
  return new Set((data ?? []).map((row) => row.niche)).size;
}

async function catalogUsesLegacyFormat(admin: SupabaseClient): Promise<boolean> {
  const { data } = await admin
    .from("premium_article_templates")
    .select("html")
    .like("template_key", "recurring-stream-%")
    .limit(1)
    .maybeSingle();

  if (!data?.html || typeof data.html !== "string") return false;
  return !data.html.includes('class="recurring-article-body"');
}

/** Returns true when the catalog needs seeding or topping up. */
export async function recurringStreamNeedsSeed(admin: SupabaseClient): Promise<boolean> {
  const [count, nicheCount, legacyFormat] = await Promise.all([
    countSeededRecurringArticles(admin),
    countSeededNiches(admin),
    catalogUsesLegacyFormat(admin),
  ]);
  return (
    count < RECURRING_STREAM_TARGET_COUNT ||
    nicheCount < RECURRING_STREAM_NICHES.length ||
    legacyFormat
  );
}

/** Seed recurring-stream article templates once (idempotent). Pass force to replace existing rows. */
export async function seedRecurringStreamArticles(
  admin: SupabaseClient,
  options?: { force?: boolean }
): Promise<{ inserted: number; skipped: boolean; total: number; replaced?: boolean }> {
  const force = options?.force ?? false;
  const existing = await countSeededRecurringArticles(admin);
  const nicheCount = await countSeededNiches(admin);
  const incompleteNiches = nicheCount < RECURRING_STREAM_NICHES.length;

  if (existing >= RECURRING_STREAM_TARGET_COUNT && !force) {
    if (!incompleteNiches) {
      return { inserted: 0, skipped: true, total: RECURRING_STREAM_TARGET_COUNT };
    }
    // Full row count but missing niches — upsert catalog without wiping ids.
  }

  if (force && existing > 0) {
    const { error: deleteError } = await admin
      .from("premium_article_templates")
      .delete()
      .like("template_key", "recurring-stream-%");
    if (deleteError) throw new Error(deleteError.message);
  }

  const beforeCount = force ? 0 : existing;
  const catalog = buildRecurringStreamCatalog();
  const rows = catalog.map((article) => ({
    template_key: article.templateKey,
    niche: article.niche,
    title: article.title,
    slug: article.slug,
    html: article.html,
    excerpt: article.excerpt,
    meta_description: article.metaDescription,
    angle: article.angle,
  }));

  const { error } = await admin
    .from("premium_article_templates")
    .upsert(rows, { onConflict: "template_key" });

  if (error) throw new Error(error.message);

  const after = await countSeededRecurringArticles(admin);
  return {
    inserted: after - beforeCount,
    skipped: false,
    total: after,
    replaced: force,
  };
}

export interface StoredArticleTemplate {
  id: number;
  template_key: string;
  niche: string;
  title: string;
  slug: string;
  html: string;
  excerpt: string | null;
  meta_description: string | null;
  angle: string | null;
}

export async function listRecurringStreamArticles(
  supabase: SupabaseClient,
  niche?: string
): Promise<StoredArticleTemplate[]> {
  // List payload omits html — previews load full body separately.
  let query = supabase
    .from("premium_article_templates")
    .select("id, template_key, niche, title, slug, excerpt, meta_description, angle")
    .like("template_key", "recurring-stream-%")
    .order("id", { ascending: true });

  if (niche && niche !== "All") {
    query = query.eq("niche", niche);
  }

  const { data, error } = await query;
  if (error) {
    // Table missing / not in schema cache yet
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({ ...row, html: "" })) as StoredArticleTemplate[];
}
