import { extractJsonFromText } from "@/features/blog-builder/lib/ai";

const TONES = ["authoritative", "conversational", "bold"] as const;

export type SuggestedTone = (typeof TONES)[number];

export function parseSuggestedTone(
  raw: string
): { suggestedTone: SuggestedTone; toneReason: string } | null {
  const parsed = extractJsonFromText(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  const tone = typeof obj.tone === "string" ? obj.tone.trim().toLowerCase() : "";
  if (!(TONES as readonly string[]).includes(tone)) return null;
  return {
    suggestedTone: tone as SuggestedTone,
    toneReason:
      typeof obj.reason === "string" && obj.reason.trim()
        ? obj.reason.trim().slice(0, 160)
        : "Best fit for your niche and topic",
  };
}
