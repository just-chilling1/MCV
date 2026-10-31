import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleClient } from "@/lib/api-auth";

export type CraftVaultFields = {
  title: string;
  content: string;
  affiliate_link?: string | null;
  niche?: string | null;
  platform?: string[];
  tone?: string;
  length?: string;
  hook?: string | null;
  cta?: string | null;
  images?: unknown;
};

/**
 * Persist a DFY Craft article to My Vault (`articles`).
 * Prefer service role after the caller has authenticated — user-scoped inserts
 * were silently failing RLS while the UI still claimed "Saved to My Vault".
 */
export async function saveCraftArticleToVault(
  userClient: SupabaseClient,
  userId: string,
  fields: CraftVaultFields
): Promise<{ id: string; title: string; content: string; hook: string | null; cta: string | null; niche: string | null; affiliate_link: string | null }> {
  const writer = getServiceRoleClient() ?? userClient;
  const row = {
    user_id: userId,
    title: fields.title,
    content: fields.content,
    affiliate_link: fields.affiliate_link ?? null,
    niche: fields.niche ?? null,
    platform: fields.platform ?? ["medium", "linkedin"],
    tone: fields.tone ?? "authoritative",
    length: fields.length ?? "medium",
    status: "draft",
    hook: fields.hook ?? null,
    cta: fields.cta ?? null,
    ...(fields.images !== undefined ? { images: fields.images } : {}),
  };

  const { data: article, error } = await writer
    .from("articles")
    .insert(row)
    .select("id, title, content, hook, cta, niche, affiliate_link")
    .single();

  if (error || !article) {
    throw new Error(error?.message ?? "Failed to save Craft article to My Vault");
  }

  return article as {
    id: string;
    title: string;
    content: string;
    hook: string | null;
    cta: string | null;
    niche: string | null;
    affiliate_link: string | null;
  };
}

export async function updateCraftArticleInVault(
  userClient: SupabaseClient,
  userId: string,
  articleId: string,
  patch: { content: string; images?: unknown }
): Promise<void> {
  const writer = getServiceRoleClient() ?? userClient;
  const { error } = await writer
    .from("articles")
    .update({
      content: patch.content,
      ...(patch.images !== undefined ? { images: patch.images } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to update Craft article in My Vault");
  }
}
