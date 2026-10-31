import {
  callChatWithFallback,
  joinArticleSections,
  parseArticleJson,
  type CallRapidChatOptions,
} from "@/lib/rapidapi-chat";
import { scrapePage } from "@/features/blog-builder/lib/scrape";

const TONE_PROMPTS: Record<string, string> = {
  authoritative:
    "Write in an authoritative, expert tone. Use data, statistics, and confident language. Position the author as a thought leader.",
  conversational:
    "Write in a friendly, conversational tone. Use personal anecdotes, ask questions, and connect with the reader emotionally.",
  bold: "Write in a bold, provocative tone. Challenge conventional thinking, make strong statements, and be unapologetic.",
};

const LENGTH_TOKENS: Record<string, number> = {
  short: 500,
  medium: 1000,
  long: 1500,
};

const PLATFORM_FORMATS: Record<string, string> = {
  linkedin: `Format for LinkedIn:
- Start with a powerful hook in the first 2 lines (before the "see more" fold)
- Use line breaks between paragraphs for readability
- Include personal experience or story
- End with a clear call-to-action and question to encourage engagement
- Suggest 3-5 relevant hashtags at the end`,

  medium: `Format for Medium:
- Use a compelling headline that promises value
- Include a strong opening paragraph that hooks the reader
- Use subheadings (##) to break up sections
- Include quotes, statistics, or examples
- End with key takeaways and a CTA`,

  quora: `Format for Quora answer:
- Open by directly answering the question in 1-2 sentences
- Expand with detailed explanation and personal experience
- Use bullet points and numbered lists for scannability
- Include relevant data or examples
- End with a brief summary and invite the reader to follow for more`,

  reddit: `Format for Reddit post:
- Write a clear, specific title — avoid clickbait
- Open with a TL;DR or key takeaway
- Use short paragraphs and line breaks
- Be genuinely helpful and conversational — avoid marketing speak
- End with a question to invite discussion`,

  twitter: `Format for X/Twitter thread:
- Tweet 1: Bold hook or controversial insight (under 280 chars)
- Break key points into individual tweets, each standing alone
- Use line breaks and short sentences for readability
- Include 1-2 relevant stats or data points
- Final tweet: CTA + 2-3 hashtags`,

  facebook: `Format for Facebook post:
- Start with an attention-grabbing first sentence or question
- Use emojis to make the post visually engaging
- Break text into short, readable paragraphs
- Include clear benefits of the product/link being shared
- End with a strong, direct call-to-action
- Suggest 2-3 relevant hashtags`,
};

export interface CraftProductInfo {
  title?: string;
  description?: string;
  h1?: string;
  price?: string;
  bodySnippet?: string;
}

export interface GenerateCraftArticleInput {
  topic: string;
  platforms: string[];
  tone: string;
  length: string;
  affiliateLink?: string;
  niche?: string;
  productInfo?: CraftProductInfo | null;
  customPrompt?: string;
  /** DFY passes a shorter retry budget so a hung call falls back inside the route limit. */
  chat?: Pick<CallRapidChatOptions, "maxRetries" | "timeoutMs" | "label">;
}

export interface GenerateCraftArticleResult {
  hook: string;
  body: string;
  cta: string;
  fullContent: string;
}

export async function scrapeProductInfo(url: string): Promise<CraftProductInfo | null> {
  try {
    // Same fast path as /api/scrape-link — skip the slow JS-render image hunt.
    const scraped = await scrapePage(url, { skipImageFallback: true });
    if (!scraped) return null;
    return {
      title: scraped.title || "",
      description: scraped.description || "",
      h1: scraped.h1 || "",
      price: scraped.price || "",
      bodySnippet: (scraped.bodySnippet || "").substring(0, 500),
    };
  } catch (err) {
    console.error("Scrape error in craft generator:", err);
    return null;
  }
}

/** Shared Craft article writer — same prompts as /api/generate. */
export async function generateCraftArticle(
  input: GenerateCraftArticleInput
): Promise<GenerateCraftArticleResult> {
  const {
    topic,
    platforms: targetPlatforms,
    tone,
    length,
    affiliateLink,
    niche,
    customPrompt,
  } = input;
  let productInfo = input.productInfo ?? null;

  if (affiliateLink && !productInfo) {
    productInfo = await scrapeProductInfo(affiliateLink);
  }

  const platformFormatText = targetPlatforms
    .map((p) => PLATFORM_FORMATS[p] || "")
    .join("\n\n");

  const affiliateInstruction = affiliateLink
    ? `\n\nIMPORTANT: Naturally weave in a reference to this product/service link: ${affiliateLink}. 
      Do NOT just paste the raw URL. Instead, integrate it as an HTML link with descriptive text (like the product name). 
      Format: <a href='${affiliateLink}' target='_blank' class='text-brass-700 font-bold underline decoration-2 underline-offset-4'>Product Name</a>. 
      NOTE: Use single quotes (') for HTML attributes inside the JSON string to avoid breaking the JSON format! 
      Make it feel organic and helpful.`
    : "";

  const nicheContext = niche ? `\nThe context is ${niche}.` : "";

  const productContext = productInfo
    ? `\n\nACTUAL PRODUCT DATA (Source of Truth):
- Title: ${productInfo.title || "Unknown"}
- Description: ${productInfo.description || ""}
- Found on Page: ${productInfo.h1 || ""}
- Price Info: ${productInfo.price || ""}
- Snippet: ${productInfo.bodySnippet || ""}

CRITICAL REQUIREMENT: You MUST base the content ENTIRELY on the actual product features above. 
If it is a physical item (like a lantern, decor, or gadget), write about its physical benefits, price, and how it looks. 
Do NOT talk about 'Digital Storefronts', 'E-commerce algorithms', or 'Marketing Strategy' unless the product is specifically a marketing tool. 
Base your 'Hook', 'Body', and 'CTA' on the REAL product provided.`
    : "";

  const systemPrompt = `You are an expert copywriter and sales strategist. Your goal is to write highly relevant, specific, and engaging social media content.

${TONE_PROMPTS[tone] || TONE_PROMPTS.authoritative}

${platformFormatText}
${productContext}
${nicheContext}
${affiliateInstruction}

Important guidelines:
- Be extremely specific about the product features and benefits mentioned in the data.
- Avoid generic "business coach" or "marketing guru" language unless it fits the product perfectly.
- If the item is a festive or cultural product (Ramadan, Christmas, etc.), use a warm, celebratory, and welcoming tone.
- Do NOT include any disclaimers about AI-generated content.
- DO NOT use Markdown formatting (*, #, etc). YOU MUST USE ONLY HTML TAGS (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <br>).
- CRITICAL: When writing HTML inside the JSON string, you MUST use SINGLE QUOTES inside HTML tags.
- ORGANIZATION: Write a scannable article with a short opening, 4-6 <h2> sections, short paragraphs, and at least one <ul> or <ol>.
- LANGUAGE: Write ALL headings, paragraphs, hooks, and CTAs in English only. Never mix Chinese, Japanese, Korean, or other non-English scripts into the prose. If product source text is in another language, translate the meaning into English. You may keep a foreign product/brand name as a proper noun only.`;

  const userPrompt = `Create a ${length} (approximately ${LENGTH_TOKENS[length] || 1000} words) article about: "${topic}"

${targetPlatforms.length > 1 ? `This article should work well across these platforms: ${targetPlatforms.join(", ")}` : ""}

Structure your response in this exact JSON format. The string values MUST contain HTML formatting tags, not Markdown:
{
  "hook": "The opening hook/attention-grabber (first 2-3 sentences, formatted in HTML)",
  "body": "The main body of the article with proper HTML formatting (use <p>, <h2>, <ul>, etc.)",
  "cta": "The call-to-action section at the end (HTML formatted)"
}

Make the content compelling, valuable, and ready to publish immediately. Respond ONLY with the JSON object.`;

  const finalSystemPrompt = customPrompt
    ? `You are an expert SEO content writer. Write complete, real articles with actual content — never use placeholder brackets or template text. Always format output as HTML (no markdown). Use clear <h2> sections, short <p> tags, and at least one <ul> or <ol>. Write ALL prose in English only. Respond ONLY with valid JSON: {"hook": "...", "body": "...", "cta": "..."}`
    : systemPrompt;

  const finalUserPrompt = customPrompt
    ? `${customPrompt}\n\nRespond ONLY with this exact JSON format (use HTML formatting inside values). English only:\n{"hook": "opening hook HTML", "body": "main article body HTML", "cta": "call-to-action HTML"}`
    : userPrompt;

  const result = await callChatWithFallback(
    [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: finalUserPrompt },
    ],
    { label: "article", maxRetries: 5, timeoutMs: 120_000, ...input.chat }
  );
  const parsed = parseArticleJson(result);
  const fullContent = joinArticleSections(parsed);

  if (!fullContent.trim() || /^\s*\{\s*["']hook["']/.test(fullContent)) {
    console.error("Article parse produced unusable content. Raw prefix:", result.slice(0, 240));
    throw new Error("Article generated but could not be formatted. Please regenerate.");
  }

  return {
    hook: parsed.hook,
    body: parsed.body,
    cta: parsed.cta,
    fullContent,
  };
}
