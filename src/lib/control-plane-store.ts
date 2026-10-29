import { createClient } from "@supabase/supabase-js";
import { buildDefaultCatalog, readCatalog, type PromoCatalog } from "@/lib/control-plane-catalog";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const MISSING_TABLE =
  "Promo catalog table is missing. Run supabase/migrations/20261019120000_control_plane_catalog.sql on this Supabase project.";

export async function loadStoredCatalog(): Promise<PromoCatalog> {
  const defaults = buildDefaultCatalog();
  const supabase = adminClient();
  if (!supabase) return { ...defaults, storage: "unavailable" };

  const { data, error } = await supabase
    .from("site_promo_settings")
    .select("catalog")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.warn("[control-plane]", error.message);
    return { ...defaults, storage: "unavailable" };
  }
  if (!data?.catalog) return { ...defaults, storage: "defaults" };

  try {
    const catalog = readCatalog(data.catalog);
    return { ...catalog, storage: "saved" };
  } catch {
    return { ...defaults, storage: "defaults" };
  }
}

export async function saveStoredCatalog(catalog: PromoCatalog): Promise<void> {
  const supabase = adminClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set on this app.");

  const { error } = await supabase.from("site_promo_settings").upsert(
    { id: 1, catalog, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  if (error) {
    if (/schema cache|does not exist|relation|column/i.test(error.message)) {
      throw new Error(MISSING_TABLE);
    }
    throw new Error(error.message);
  }
}
