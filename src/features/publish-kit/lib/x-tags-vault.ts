import type { SupabaseClient } from "@supabase/supabase-js";

export interface SavedXTag {
  id: string;
  site_id: string;
  tag: string;
  reason: string | null;
  batch_id: string;
  created_at: string;
}

export async function listXTagsForSite(
  supabase: SupabaseClient,
  userId: string,
  siteId: string
): Promise<SavedXTag[]> {
  const { data, error } = await supabase
    .from("site_x_tags")
    .select("id, site_id, tag, reason, batch_id, created_at")
    .eq("user_id", userId)
    .eq("site_id", siteId)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }
  return (data ?? []) as SavedXTag[];
}

export async function saveXTagBatch(
  supabase: SupabaseClient,
  userId: string,
  siteId: string,
  tags: { tag: string; reason?: string }[]
): Promise<SavedXTag[]> {
  const batchId = crypto.randomUUID();

  const { error: deleteError } = await supabase
    .from("site_x_tags")
    .delete()
    .eq("user_id", userId)
    .eq("site_id", siteId);

  if (deleteError && deleteError.code !== "42P01") {
    throw new Error(deleteError.message);
  }

  const rows = tags.map((row) => ({
    user_id: userId,
    site_id: siteId,
    tag: row.tag.trim(),
    reason: row.reason?.trim() || null,
    batch_id: batchId,
  }));

  const { data, error } = await supabase
    .from("site_x_tags")
    .insert(rows)
    .select("id, site_id, tag, reason, batch_id, created_at");

  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }
  return (data ?? []) as SavedXTag[];
}

export async function countXTagsBySite(
  supabase: SupabaseClient,
  userId: string,
  siteIds: string[]
): Promise<Record<string, number>> {
  if (siteIds.length === 0) return {};

  const { data, error } = await supabase
    .from("site_x_tags")
    .select("site_id")
    .eq("user_id", userId)
    .in("site_id", siteIds);

  if (error) {
    if (error.code === "42P01") return {};
    throw new Error(error.message);
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { site_id: string }).site_id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
