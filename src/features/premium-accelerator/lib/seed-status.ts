import type { SupabaseClient } from "@supabase/supabase-js";
import { ACCELERATOR_TARGET_COUNT } from "./catalog";

/** Load which accelerator catalog ids exist as seeded templates in Supabase. */
export async function loadSeededAcceleratorKeys(
  db: SupabaseClient
): Promise<Set<string>> {
  const { data, error } = await db
    .from("sites")
    .select("template_key")
    .eq("is_template", true)
    .like("template_key", "accelerator-%");

  if (error) {
    throw new Error(error.message);
  }

  return new Set(
    (data ?? [])
      .map((row) => (row as { template_key: string }).template_key)
      .filter(Boolean)
  );
}

export async function getAcceleratorSeedStatus(db: SupabaseClient) {
  const seededKeys = await loadSeededAcceleratorKeys(db);
  const seededCount = seededKeys.size;

  return {
    seededKeys,
    seededCount,
    total: ACCELERATOR_TARGET_COUNT,
    ready: seededCount >= ACCELERATOR_TARGET_COUNT,
  };
}
