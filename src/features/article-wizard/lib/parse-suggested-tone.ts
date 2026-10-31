import { extractJsonFromText } from "@/features/blog-builder/lib/ai";

const TONES = ["authoritative", "conversational", "bold"] as const;

export type SuggestedTone = (typeof TONES)[number];

function normalizeTone(value: unknown): SuggestedTone | null {
  if (typeof value !== "string") return null;
  const lower = value.trim().toLowerCase();
  if ((TONES as readonly string[]).includes(lower)) return lower as SuggestedTone;
  // Models often return "Authoritative tone" or "Tone: bold"
  for (const tone of TONES) {
    if (lower.includes(tone)) return tone;
  }
  return null;
}

function reasonFrom(obj: Record<string, unknown>): string {
  for (const key of ["reason", "toneReason", "why", "explanation"]) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 160);
  }
  return "Best fit for your niche and topic";
}

/** Heuristic when the model reply can't be parsed — still give a usable tip. */
export function fallbackSuggestedTone(
  niche: string,
  topic = ""
): { suggestedTone: SuggestedTone; toneReason: string } {
  const hay = `${niche} ${topic}`.toLowerCase();
  if (/\b(crypto|hustle|disrupt|bold|provoc|challeng|contrarian)\b/.test(hay)) {
    return {
      suggestedTone: "bold",
      toneReason: "Bold tone fits attention-heavy niches and strong claims.",
    };
  }
  if (
    /\b(health|wellness|fitness|beauty|travel|food|lifestyle|parent|self-?help|convers)\b/.test(
      hay
    )
  ) {
    return {
      suggestedTone: "conversational",
      toneReason: "Conversational tone feels approachable for lifestyle audiences.",
    };
  }
  return {
    suggestedTone: "authoritative",
    toneReason: "Authoritative tone builds trust for expert-led topics.",
  };
}

export function parseSuggestedTone(
  raw: string
): { suggestedTone: SuggestedTone; toneReason: string } | null {
  const parsed = extractJsonFromText(raw);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    const tone = normalizeTone(obj.tone ?? obj.suggestedTone ?? obj.bestTone);
    if (tone) {
      return { suggestedTone: tone, toneReason: reasonFrom(obj) };
    }
  }

  // Plain-text reply: "conversational" / "I recommend bold"
  const fromText = normalizeTone(raw);
  if (fromText) {
    return {
      suggestedTone: fromText,
      toneReason: "Best fit for your niche and topic",
    };
  }

  return null;
}
