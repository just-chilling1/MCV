import type { SupabaseClient } from "@supabase/supabase-js";

export interface SavedXThread {
  id: string;
  site_id: string;
  text: string;
  angle: string | null;
  image_url: string | null;
  batch_id: string;
  batch_label: string | null;
  is_pinned: boolean;
  created_at: string;
}

/** Postgres code for a missing column (migration not applied yet). */
const UNDEFINED_COLUMN = "42703";
const UNDEFINED_TABLE = "42P01";

export async function listXThreadsForSite(
  supabase: SupabaseClient,
  userId: string,
  siteId: string
): Promise<SavedXThread[]> {
  const { data, error } = await supabase
    .from("site_x_threads")
    .select("id, site_id, text, angle, image_url, batch_id, batch_label, is_pinned, created_at")
    .eq("user_id", userId)
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (!error) return (data ?? []) as SavedXThread[];
  if (error.code === UNDEFINED_TABLE) return [];

  if (error.code === UNDEFINED_COLUMN) {
    // batch_label/is_pinned migration not applied yet — fall back to base columns.
    const { data: baseData, error: baseError } = await supabase
      .from("site_x_threads")
      .select("id, site_id, text, angle, image_url, batch_id, created_at")
      .eq("user_id", userId)
      .eq("site_id", siteId)
      .order("created_at", { ascending: false });

    if (baseError) {
      if (baseError.code === UNDEFINED_TABLE) return [];
      throw new Error(baseError.message);
    }
    return (baseData ?? []).map((row) => ({
      ...(row as Omit<SavedXThread, "batch_label" | "is_pinned">),
      batch_label: null,
      is_pinned: false,
    }));
  }

  throw new Error(error.message);
}

/**
 * Save a generation as a new thread version. Existing batches are kept so
 * every generation adds a version instead of replacing the previous one.
 */
export async function saveXThreadBatch(
  supabase: SupabaseClient,
  userId: string,
  siteId: string,
  threads: { text: string; angle?: string; imageUrl?: string }[]
): Promise<SavedXThread[]> {
  const batchId = crypto.randomUUID();

  const rows = threads.map((thread) => ({
    user_id: userId,
    site_id: siteId,
    text: thread.text.trim(),
    angle: thread.angle?.trim() || null,
    image_url: thread.imageUrl?.trim() || null,
    batch_id: batchId,
  }));

  const { data, error } = await supabase
    .from("site_x_threads")
    .insert(rows)
    .select("id, site_id, text, angle, image_url, batch_id, created_at");

  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }
  return (data ?? []) as SavedXThread[];
}

export class ThreadColumnsMissingError extends Error {
  constructor() {
    super(
      "Thread naming isn't enabled yet — apply the latest database migration (site_x_threads_labels) first."
    );
    this.name = "ThreadColumnsMissingError";
  }
}

export async function renameXThreadBatch(
  supabase: SupabaseClient,
  userId: string,
  siteId: string,
  batchId: string,
  label: string | null
): Promise<void> {
  const { error } = await supabase
    .from("site_x_threads")
    .update({ batch_label: label })
    .eq("user_id", userId)
    .eq("site_id", siteId)
    .eq("batch_id", batchId);

  if (error) {
    if (error.code === UNDEFINED_COLUMN) throw new ThreadColumnsMissingError();
    throw new Error(error.message);
  }
}

export async function setXThreadBatchPinned(
  supabase: SupabaseClient,
  userId: string,
  siteId: string,
  batchId: string,
  pinned: boolean
): Promise<void> {
  if (pinned) {
    // Only one pinned version per site.
    const { error: clearError } = await supabase
      .from("site_x_threads")
      .update({ is_pinned: false })
      .eq("user_id", userId)
      .eq("site_id", siteId);

    if (clearError) {
      if (clearError.code === UNDEFINED_COLUMN) throw new ThreadColumnsMissingError();
      throw new Error(clearError.message);
    }
  }

  const { error } = await supabase
    .from("site_x_threads")
    .update({ is_pinned: pinned })
    .eq("user_id", userId)
    .eq("site_id", siteId)
    .eq("batch_id", batchId);

  if (error) {
    if (error.code === UNDEFINED_COLUMN) throw new ThreadColumnsMissingError();
    throw new Error(error.message);
  }
}

export async function deleteXThreadBatch(
  supabase: SupabaseClient,
  userId: string,
  siteId: string,
  batchId: string
): Promise<void> {
  const { error } = await supabase
    .from("site_x_threads")
    .delete()
    .eq("user_id", userId)
    .eq("site_id", siteId)
    .eq("batch_id", batchId);

  if (error && error.code !== "42P01") {
    throw new Error(error.message);
  }
}

/** Counts saved thread versions (batches) per site, not individual posts. */
export async function countXThreadsBySite(
  supabase: SupabaseClient,
  userId: string,
  siteIds: string[]
): Promise<Record<string, number>> {
  if (siteIds.length === 0) return {};

  const { data, error } = await supabase
    .from("site_x_threads")
    .select("site_id, batch_id")
    .eq("user_id", userId)
    .in("site_id", siteIds);

  if (error) {
    if (error.code === "42P01") return {};
    throw new Error(error.message);
  }

  const batchesBySite: Record<string, Set<string>> = {};
  for (const row of (data ?? []) as { site_id: string; batch_id: string }[]) {
    (batchesBySite[row.site_id] ??= new Set()).add(row.batch_id);
  }

  const counts: Record<string, number> = {};
  for (const [siteId, batches] of Object.entries(batchesBySite)) {
    counts[siteId] = batches.size;
  }
  return counts;
}
