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

/** Keep prompts short — RapidAPI texttoimage often returns "server is busy" on long prompts. */
function slotSceneDirection(slotId: ArticleImageSlot["id"]): string {
  switch (slotId) {
    case "header":
      return "wide establishing scene in a real place";
    case "mid":
      return "tight close-up of a tangible detail";
    case "conclusion":
      return "real-world outcome in a believable setting";
  }
}

/** Visual Lab + DFY — concrete subject, slot-specific scene, quality guardrails. */
export function buildArticleImagePrompt(
  title: string,
  content: string,
  slot: Pick<ArticleImageSlot, "id" | "suggestion" | "framing">,
  framingOverride?: string
): string {
  const shortTitle = title.trim().slice(0, 80);
  const excerpt = stripHtmlForImagePrompt(content).substring(0, 90);
  const framing = framingOverride || slot.framing;
  return `Photorealistic editorial photo of "${shortTitle}", ${slotSceneDirection(slot.id)}, ${framing}, ${excerpt}. Natural light, sharp detail. No text, logos, or watermarks.`.slice(
    0,
    480
  );
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
