import { generateWithGPT, extractJsonFromText } from "./ai";

/**
 * Derive current buyer-intent "trending angles" for a niche.
 *
 * NOTE: the shared RapidAPI GPT endpoint runs with web_access:false, so these
 * are model-derived signals (what buyers in the niche commonly research right
 * now), not live search-trend data. For real-time trends, wire a Google
 * Trends / keyword API and feed its output into `trendContext` instead.
 *
 * Called ONCE per site build (not per post) and shared across the cluster.
 */
export async function fetchTrendingAngles(territory: string, hobby: string): Promise<string> {
  const niche = territory.trim() || hobby.trim();
  if (!niche) return "";

  try {
    const system = `You are an affiliate market researcher. You identify what buyers in a niche are actively researching and purchasing right now.
Return ONLY JSON: { "angles": ["...", ...] } with no commentary.`;
    const user = `Niche: "${niche}".
List 5-6 current, high buyer-intent angles for 2026: trending sub-topics, the questions people ask before buying, popular comparisons, and the pain points that drive purchases. Each item is one short phrase (under 12 words). JSON only.`;

    const raw = await generateWithGPT(system, user, {
      temperature: 0.5,
      maxRetries: 2,
      timeoutMs: 25_000,
    });

    const parsed = extractJsonFromText(raw) as { angles?: unknown } | null;
    const angles = Array.isArray(parsed?.angles)
      ? (parsed!.angles as unknown[]).filter(
          (a): a is string => typeof a === "string" && a.trim().length > 4
        )
      : [];

    return angles
      .slice(0, 6)
      .map((a) => `- ${a.trim()}`)
      .join("\n");
  } catch {
    return "";
  }
}
