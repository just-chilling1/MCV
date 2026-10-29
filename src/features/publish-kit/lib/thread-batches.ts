import type { SavedXThread } from "./x-threads-vault";

export interface ThreadVersion {
  batchId: string;
  createdAt: string;
  label: string | null;
  pinned: boolean;
  posts: SavedXThread[];
}

/**
 * Group saved thread posts into versions (batches), newest first.
 * Assumes the API returns threads ordered by created_at descending and
 * preserves the within-batch post order it provides.
 */
export function groupThreadsIntoVersions(threads: SavedXThread[]): ThreadVersion[] {
  const map = new Map<string, ThreadVersion>();
  for (const thread of threads) {
    let version = map.get(thread.batch_id);
    if (!version) {
      version = {
        batchId: thread.batch_id,
        createdAt: thread.created_at,
        label: thread.batch_label ?? null,
        pinned: thread.is_pinned ?? false,
        posts: [],
      };
      map.set(thread.batch_id, version);
    }
    version.posts.push(thread);
  }
  return [...map.values()];
}

/** Pinned version first, then newest first. */
export function sortVersionsForDisplay(versions: ThreadVersion[]): ThreadVersion[] {
  return [...versions].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

/**
 * Display name for a version. `chronologicalIndex` is 1 for the oldest
 * thread so names stay stable as new versions are added.
 */
export function threadVersionName(version: ThreadVersion, chronologicalIndex: number): string {
  return version.label?.trim() || `Story thread #${chronologicalIndex}`;
}

/** The version "View thread" quick actions should open: pinned first, else newest. */
export function preferredVersion(versions: ThreadVersion[]): ThreadVersion | null {
  return versions.find((v) => v.pinned) ?? versions[0] ?? null;
}

export function formatThreadVersionDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
