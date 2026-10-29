import type { SupabaseClient } from "@supabase/supabase-js";

/** Parallel head-count queries — avoids fetching every row for large tables. */
export async function countRowsBySiteIds(
  supabase: SupabaseClient,
  table: string,
  siteIds: string[],
  filters?: { userId?: string; status?: string }
): Promise<Record<string, number>> {
  if (siteIds.length === 0) return {};

  const pairs = await Promise.all(
    siteIds.map(async (siteId) => {
      let query = supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("site_id", siteId);

      if (filters?.userId) query = query.eq("user_id", filters.userId);
      if (filters?.status) query = query.eq("status", filters.status);

      const { count, error } = await query;
      return { siteId, count: error ? 0 : (count ?? 0) };
    })
  );

  const counts: Record<string, number> = {};
  for (const { siteId, count } of pairs) {
    counts[siteId] = count;
  }
  return counts;
}
