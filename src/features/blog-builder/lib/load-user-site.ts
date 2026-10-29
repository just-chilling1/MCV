import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogSite } from "../types";

/** Resolve the active site from wizard session, or the most recently created site. */
export async function loadActiveUserSite(
  supabase: SupabaseClient,
  userId: string,
  sessionSiteId?: string | null
): Promise<BlogSite | null> {
  if (sessionSiteId) {
    const { data } = await supabase
      .from("sites")
      .select("*")
      .eq("id", sessionSiteId)
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return data as BlogSite;
  }

  const { data: latest } = await supabase
    .from("sites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (latest as BlogSite) ?? null;
}
