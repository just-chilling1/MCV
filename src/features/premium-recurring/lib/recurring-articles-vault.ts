import type { SupabaseClient } from "@supabase/supabase-js";
import { countRowsBySiteIds } from "@/lib/site-counts";

/** Placeholder catalog row for DFY Profit AI articles when template_id is still NOT NULL. */
export const DFY_GENERATED_TEMPLATE_KEY = "dfy-generated-authority";

export interface SavedRecurringArticle {
  id: string;
  site_id: string;
  template_id: number | null;
  title: string;
  html: string;
  created_at: string;
}

function isTemplateIdNotNullViolation(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("template_id") && lower.includes("not-null");
}

async function ensureDfyGeneratedTemplateId(
  admin: SupabaseClient
): Promise<number | null> {
  const { data: existing } = await admin
    .from("premium_article_templates")
    .select("id")
    .eq("template_key", DFY_GENERATED_TEMPLATE_KEY)
    .maybeSingle();

  if (existing?.id) return existing.id as number;

  const { data, error } = await admin
    .from("premium_article_templates")
    .insert({
      template_key: DFY_GENERATED_TEMPLATE_KEY,
      niche: "System",
      title: "Done-For-You generated article",
      slug: DFY_GENERATED_TEMPLATE_KEY,
      html: "<p></p>",
      excerpt: "Placeholder for AI-generated Done-For-You Profit articles.",
      angle: "dfy-generated",
    })
    .select("id")
    .single();

  if (!error && data?.id) return data.id as number;

  const { data: raced } = await admin
    .from("premium_article_templates")
    .select("id")
    .eq("template_key", DFY_GENERATED_TEMPLATE_KEY)
    .maybeSingle();

  return (raced?.id as number | undefined) ?? null;
}

export async function listRecurringArticlesForSite(
  supabase: SupabaseClient,
  userId: string,
  siteId: string
): Promise<SavedRecurringArticle[]> {
  const { data, error } = await supabase
    .from("site_recurring_articles")
    .select("id, site_id, template_id, title, html, created_at")
    .eq("user_id", userId)
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SavedRecurringArticle[];
}

export async function saveRecurringArticle(
  supabase: SupabaseClient,
  userId: string,
  siteId: string,
  templateId: number,
  title: string,
  html: string
): Promise<SavedRecurringArticle> {
  const { data, error } = await supabase
    .from("site_recurring_articles")
    .upsert(
      {
        user_id: userId,
        site_id: siteId,
        template_id: templateId,
        title,
        html,
      },
      { onConflict: "user_id,site_id,template_id" }
    )
    .select("id, site_id, template_id, title, html, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as SavedRecurringArticle;
}

/** Persist a generated (non-template) authority article on an offer. */
export async function saveGeneratedAuthorityArticle(
  supabase: SupabaseClient,
  userId: string,
  siteId: string,
  title: string,
  html: string,
  options?: { admin?: SupabaseClient | null }
): Promise<SavedRecurringArticle> {
  const { data, error } = await supabase
    .from("site_recurring_articles")
    .insert({
      user_id: userId,
      site_id: siteId,
      template_id: null,
      title,
      html,
    })
    .select("id, site_id, template_id, title, html, created_at")
    .single();

  if (!error) return data as SavedRecurringArticle;

  if (!isTemplateIdNotNullViolation(error.message)) {
    throw new Error(error.message);
  }

  // Production DBs that never applied the optional-template migration still require template_id.
  const admin = options?.admin;
  if (!admin) {
    throw new Error(error.message);
  }

  const templateId = await ensureDfyGeneratedTemplateId(admin);
  if (!templateId) {
    throw new Error(error.message);
  }

  return saveRecurringArticle(supabase, userId, siteId, templateId, title, html);
}

export async function countRecurringArticlesBySite(
  supabase: SupabaseClient,
  userId: string,
  siteIds: string[]
): Promise<Record<string, number>> {
  return countRowsBySiteIds(supabase, "site_recurring_articles", siteIds, { userId });
}
