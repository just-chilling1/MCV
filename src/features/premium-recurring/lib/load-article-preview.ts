import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogSite } from "@/features/blog-builder/types";
import { weaveAffiliateIntoArticle } from "./catalog";

export interface RecurringArticlePreview {
  id: number;
  title: string;
  html: string;
  excerpt: string | null;
  metaDescription: string | null;
  promoLink: string | null;
}

export async function loadRecurringArticlePreview(
  reader: SupabaseClient,
  articleId: number,
  site: BlogSite
): Promise<RecurringArticlePreview> {
  const { data, error } = await reader
    .from("premium_article_templates")
    .select("id, title, html, excerpt, meta_description")
    .eq("id", articleId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Article not found");
  }

  const affiliateUrl = site.armed_links?.[0]?.url?.trim() ?? "";
  const html = weaveAffiliateIntoArticle((data as { html: string }).html, affiliateUrl);

  return {
    id: (data as { id: number }).id,
    title: (data as { title: string }).title,
    html,
    excerpt: (data as { excerpt: string | null }).excerpt,
    metaDescription: (data as { meta_description: string | null }).meta_description,
    promoLink: affiliateUrl || null,
  };
}
