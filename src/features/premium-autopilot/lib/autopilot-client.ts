import { fetchJson } from "@/lib/fetch-json";
import { storageKeys } from "@/lib/storage-keys";
import type { Article } from "@/types";
import { resolveAutopilotNiche } from "./traffic-sources";

export interface AutopilotState {
  promotion_url: string | null;
  selected_niche: string;
  completed_source_ids: string[];
}

const SETTINGS_URL = "/api/premium/autopilot/settings";
const COMPLETIONS_URL = "/api/premium/autopilot/completions";

/** Defaults derived from Craft articles (core vault), not hosted offer sites. */
export interface CraftPromotionDefaults {
  articleId: string | null;
  articleTitle: string | null;
  niche: string;
  promotionUrl: string;
}

export async function fetchCraftArticles(): Promise<Article[]> {
  const result = await fetchJson<{ articles?: Article[] }>("/api/articles", {
    credentials: "include",
    cache: "no-store",
  });
  if (!result.ok || !Array.isArray(result.data.articles)) return [];
  return result.data.articles;
}

/** Prefer newest article that has an affiliate link or niche from Craft. */
export function deriveCraftPromotionDefaults(
  articles: Article[]
): CraftPromotionDefaults | null {
  if (articles.length === 0) return null;

  const withLink = articles.find((a) => a.affiliate_link?.trim());
  const pick = withLink ?? articles[0];
  if (!pick) return null;

  return {
    articleId: pick.id,
    articleTitle: pick.title,
    niche: resolveAutopilotNiche(pick.niche),
    promotionUrl: pick.affiliate_link?.trim() ?? "",
  };
}

export async function fetchAutopilotState(): Promise<AutopilotState | null> {
  const result = await fetchJson<AutopilotState>(SETTINGS_URL, {
    credentials: "include",
    cache: "no-store",
  });
  if (!result.ok) return null;
  return {
    promotion_url: result.data.promotion_url ?? null,
    selected_niche: result.data.selected_niche || "All",
    completed_source_ids: Array.isArray(result.data.completed_source_ids)
      ? result.data.completed_source_ids.filter((id) => typeof id === "string")
      : [],
  };
}

export async function saveAutopilotSettings(patch: {
  promotion_url?: string | null;
  selected_niche?: string | null;
}): Promise<boolean> {
  const result = await fetchJson(SETTINGS_URL, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return result.ok;
}

export async function setAutopilotCompletion(
  sourceId: string,
  done: boolean
): Promise<boolean> {
  if (done) {
    const result = await fetchJson(COMPLETIONS_URL, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_id: sourceId }),
    });
    return result.ok;
  }

  const result = await fetchJson(
    `${COMPLETIONS_URL}?source_id=${encodeURIComponent(sourceId)}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  return result.ok;
}

function readLegacyCompletions(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKeys.autopilotCompleted);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string" && x.length > 0)
      : [];
  } catch {
    return [];
  }
}

function clearLegacyCompletions() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKeys.autopilotCompleted);
  } catch {
    /* ignore */
  }
}

/**
 * One-time uplift: if the server has no autopilot data yet and localStorage
 * still has completions from the pre-API page, batch-POST them and clear the key.
 */
export async function migrateLegacyCompletions(
  existing: AutopilotState | null
): Promise<AutopilotState | null> {
  const legacyIds = readLegacyCompletions();
  if (legacyIds.length === 0) return existing;

  const serverEmpty =
    !existing?.promotion_url && (existing?.completed_source_ids.length ?? 0) === 0;

  if (!serverEmpty) {
    clearLegacyCompletions();
    return existing;
  }

  const result = await fetchJson(COMPLETIONS_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_ids: legacyIds }),
  });

  if (!result.ok) return existing;

  clearLegacyCompletions();
  return fetchAutopilotState();
}
