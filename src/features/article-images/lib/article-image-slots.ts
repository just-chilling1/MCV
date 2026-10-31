import type { ArticleImage } from "@/types";

export const ARTICLE_IMAGE_SLOTS = [
  {
    id: "header",
    section: "Header Image",
    suggestion: "Professional hero image related to your topic",
    position: "top" as const,
    framing: "wide shot",
  },
  {
    id: "mid",
    section: "Mid-Article Image",
    suggestion: "Data visualization or infographic",
    position: "middle" as const,
    framing: "close detail",
  },
  {
    id: "conclusion",
    section: "Conclusion Image",
    suggestion: "Call-to-action or engagement visual",
    position: "bottom" as const,
    framing: "overhead view",
  },
] as const;

export type ArticleImageSlot = (typeof ARTICLE_IMAGE_SLOTS)[number];

export function stripHtmlForImagePrompt(content: string): string {
  if (!content) return "";
  return content
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export const ARTICLE_IMAGE_FRAMINGS = ["wide shot", "close detail", "overhead view"] as const;

const IMAGE_QUALITY_GUARDRAILS =
  "Natural light, sharp focus, rich color, shallow depth of field, editorial magazine quality. No text, letters, logos, watermarks, floating coins, neon glow, or generic stock office blur.";

/** Keep prompts compact — long RapidAPI prompts often return empty / "Image not available". */
function slotSceneDirection(slotId: ArticleImageSlot["id"]): string {
  switch (slotId) {
    case "header":
      return "Wide establishing scene: one concrete subject from the title in a real physical place";
    case "mid":
      return "Tight close-up of a tangible object or material detail tied to the topic";
    case "conclusion":
      return "Real-world outcome related to the topic — a believable result in a real setting";
  }
}

/** Visual Lab + DFY — concrete subject, slot-specific scene, quality guardrails. */
export function buildArticleImagePrompt(
  title: string,
  content: string,
  slot: Pick<ArticleImageSlot, "id" | "suggestion" | "framing">,
  framingOverride?: string
): string {
  const excerpt = stripHtmlForImagePrompt(content).substring(0, 160);
  const framing = framingOverride || slot.framing;
  return `Photorealistic editorial photo. One concrete subject from "${title}". ${slotSceneDirection(slot.id)}. Framing: ${framing}. Context: ${excerpt}. ${IMAGE_QUALITY_GUARDRAILS}`;
}

export function buildDfyCraftImagePrompt(
  title: string,
  content: string,
  slot: ArticleImageSlot
): string {
  return buildArticleImagePrompt(title, content, slot);
}

export function articleImageFromSlot(
  slot: ArticleImageSlot,
  url: string,
  idPrefix: string
): ArticleImage {
  return {
    id: `${idPrefix}-${slot.id}`,
    url,
    alt: slot.section,
    section: slot.section,
    position: slot.position,
  };
}
