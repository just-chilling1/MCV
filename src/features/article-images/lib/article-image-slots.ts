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

/** Keep prompts compact — long RapidAPI prompts often return empty / "Image not available". */
export function buildArticleImagePrompt(
  title: string,
  content: string,
  slot: Pick<ArticleImageSlot, "suggestion" | "framing">,
  framingOverride?: string
): string {
  const excerpt = stripHtmlForImagePrompt(content).substring(0, 200);
  const framing = framingOverride || slot.framing;
  return `Photorealistic editorial photo, no text or letters in the frame. Topic: "${title}". Visual direction: ${slot.suggestion}. Framing: ${framing}. Context: ${excerpt}. Cinematic lighting, sharp detail, modern, engaging.`;
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
