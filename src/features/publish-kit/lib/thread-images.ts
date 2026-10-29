import type { SupabaseClient } from "@supabase/supabase-js";
import {
  HOBBY_VISUAL_QUERIES,
  normalizeImageUrl,
  persistExternalImage,
  resolveFastImageUrl,
} from "@/features/blog-builder/lib/images";

const THREAD_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "for", "to", "of", "in", "on", "with", "your", "you",
  "this", "that", "from", "just", "not", "but", "was", "were", "are", "is", "be", "been",
  "have", "has", "had", "will", "would", "could", "should", "about", "into", "after",
  "before", "when", "what", "how", "why", "who", "here", "there", "then", "than", "them",
  "they", "she", "him", "her", "our", "out", "all", "any", "can", "did", "get", "got",
  "one", "two", "three", "first", "still", "also", "only", "even", "more", "most", "some",
  "same", "over", "under", "link", "thread", "post", "start", "skip", "read", "click",
  "week", "weeks", "month", "months", "year", "years", "day", "days", "time", "times",
  "thing", "things", "really", "actually", "finally", "never", "always", "every", "made",
]);

/** Story-role visuals aligned with the 10-post thread structure. */
const ROLE_VISUAL_HINTS: Record<string, string> = {
  Hook: "bold payoff preview, aspirational outcome, high contrast hero moment, scroll-stopping",
  Scene: "authentic everyday scene, relatable person in a real place, candid documentary lighting",
  Stakes: "pressure and consequence, deadline tension, what's at risk mood, urgency",
  Failure: "frustrated stuck learning curve, failed attempts, messy desk reality, disappointment",
  "Turning point": "breakthrough clarity moment, lightbulb insight, calm focus, relief",
  Mechanism: "simple repeatable process, checklist workflow, hands doing the steps, planning",
  "Product reveal": "product in use, clean tool on desk, professional software workflow, solution",
  Proof: "measurable results, progress chart, before-after improvement metrics, celebration",
  Objection: "thoughtful evaluation, honest skepticism, deciding if it's a fit, weighing options",
  CTA: "clear next step forward, invitation to act, confident forward motion, starting journey",
};

/** Stock search phrases that pair well with niche + post keywords. */
const ROLE_STOCK_TERMS: Record<string, string> = {
  Hook: "success achievement goal breakthrough winning moment",
  Scene: "person home office kitchen table morning routine real life",
  Stakes: "stress worry deadline pressure consequence anxious",
  Failure: "frustrated confused stuck overwhelmed tired giving up",
  "Turning point": "insight clarity focus breakthrough idea realization",
  Mechanism: "planning checklist notebook workflow process steps routine",
  "Product reveal": "laptop software online business tool dashboard screen",
  Proof: "growth chart analytics results dashboard progress milestone",
  Objection: "thinking decision evaluate choice considering options",
  CTA: "starting journey forward path action confident walk",
};

/** Roles where lifestyle stock beats a generic product screenshot. */
const STOCK_FIRST_ROLES = new Set([
  "Hook",
  "Scene",
  "Stakes",
  "Failure",
  "Turning point",
  "Mechanism",
  "Objection",
  "CTA",
]);

/** Roles where scraped product/offer imagery is preferred. */
const SCRAPE_FIRST_ROLES = new Set(["Product reveal", "Proof"]);

const NICHE_KEYWORDS: Record<string, string> = {
  fitness: "fitness workout gym health training exercise",
  finance: "personal finance budget money planning savings",
  marketing: "digital marketing laptop entrepreneur online business",
  health: "wellness healthy lifestyle nutrition supplements",
  education: "online learning student study laptop course",
  relationship: "couple conversation connection together dating",
  pet: "dog training happy pet owner puppy",
  ai: "artificial intelligence technology computer creator",
  youtube: "youtube creator video editing studio content",
  affiliate: "affiliate marketing laptop entrepreneur home office",
  dating: "couple relationship conversation connection",
  supplement: "health wellness vitamins nutrition",
  presentation: "business presentation laptop office meeting",
  writing: "writer laptop content creation desk typing",
  selfhelp: "personal development motivation growth mindset success",
  beauty: "beauty skincare cosmetics self care mirror",
  travel: "travel adventure destination explore lifestyle journey",
  wellness: "wellness healthy lifestyle meditation calm",
  sport: "fitness athlete training exercise active",
  entrepreneur: "entrepreneur startup laptop business planning",
};

const SCENE_NOUNS = new Set([
  "gym", "kitchen", "office", "desk", "bedroom", "bathroom", "car", "park", "cafe",
  "coffee", "laptop", "phone", "computer", "table", "couch", "bed", "mirror", "scale",
  "receipt", "bill", "invoice", "chart", "graph", "calendar", "notebook", "dog", "cat",
  "baby", "child", "doctor", "hospital", "store", "market", "beach", "road", "train",
  "airport", "hotel", "restaurant", "classroom", "library", "studio", "garage", "yard",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/#\w+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !THREAD_STOP_WORDS.has(word) && !/^\d+$/.test(word));
}

function inferNicheVisualHint(territory: string, hobby?: string, productName?: string): string {
  if (hobby?.trim() && HOBBY_VISUAL_QUERIES[hobby.trim()]) {
    return HOBBY_VISUAL_QUERIES[hobby.trim()];
  }

  const haystack = `${territory} ${hobby ?? ""} ${productName ?? ""}`.toLowerCase();
  for (const [key, hint] of Object.entries(NICHE_KEYWORDS)) {
    if (haystack.includes(key)) return hint;
  }

  return tokenize(territory).slice(0, 4).join(" ");
}

function extractSceneNouns(threadText: string): string[] {
  return tokenize(cleanPostText(threadText)).filter((word) => SCENE_NOUNS.has(word));
}

function cleanPostText(threadText: string): string {
  return threadText.replace(/https?:\/\/\S+/g, "").replace(/#\w+/g, "").replace(/\s+/g, " ").trim();
}

/** Keywords extracted from the post copy for scrape ranking and stock search. */
export function extractThreadPostKeywords(params: {
  threadText: string;
  territory: string;
  productName?: string;
  hobby?: string;
  role: string;
}): string[] {
  const postTokens = tokenize(cleanPostText(params.threadText));
  const sceneNouns = extractSceneNouns(params.threadText);
  const territoryTokens = tokenize(params.territory);
  const roleTokens = tokenize(`${ROLE_STOCK_TERMS[params.role] ?? ""} ${ROLE_VISUAL_HINTS[params.role] ?? ""}`);
  const nicheTokens = tokenize(inferNicheVisualHint(params.territory, params.hobby, params.productName));

  const seen = new Set<string>();
  const keywords: string[] = [];

  // Post-specific words rank highest — they tie the image to what the reader just read.
  for (const word of [...postTokens, ...sceneNouns, ...territoryTokens, ...nicheTokens, ...roleTokens]) {
    if (seen.has(word)) continue;
    seen.add(word);
    keywords.push(word);
    if (keywords.length >= 16) break;
  }
  return keywords;
}

function buildStockQuery(params: {
  threadText: string;
  territory: string;
  role: string;
  productName?: string;
  hobby?: string;
}): string {
  const nicheHint = inferNicheVisualHint(params.territory, params.hobby, params.productName);
  const roleTerms = ROLE_STOCK_TERMS[params.role] ?? "authentic lifestyle scene";
  const postTerms = tokenize(cleanPostText(params.threadText)).slice(0, 6).join(" ");
  const sceneTerms = extractSceneNouns(params.threadText).join(" ");

  // Post copy leads, then niche, then story-role mood.
  return [postTerms, sceneTerms, nicheHint, roleTerms].filter(Boolean).join(" ").slice(0, 120);
}

function rolePrefersStock(role: string): boolean {
  if (SCRAPE_FIRST_ROLES.has(role)) return false;
  return STOCK_FIRST_ROLES.has(role);
}

/** Build search metadata for a thread post image. */
export function buildThreadImagePrompt(params: {
  territory: string;
  angle: string;
  threadText: string;
  productName?: string;
  hobby?: string;
  postIndex?: number;
}) {
  const role = params.angle.trim() || "Hook";
  const roleHint = ROLE_VISUAL_HINTS[role] ?? "engaging social media scene";
  const excerpt = cleanPostText(params.threadText).slice(0, 140);
  const keywords = extractThreadPostKeywords({
    threadText: params.threadText,
    territory: params.territory,
    productName: params.productName,
    hobby: params.hobby,
    role,
  });
  const stockQuery = buildStockQuery({
    threadText: params.threadText,
    territory: params.territory,
    role,
    productName: params.productName,
    hobby: params.hobby,
  });
  const sceneNouns = extractSceneNouns(params.threadText);

  return {
    role,
    keywords,
    stockQuery,
    preferStock: rolePrefersStock(role),
    title: `${role} — ${excerpt}`.slice(0, 120),
    subject: [
      inferNicheVisualHint(params.territory, params.hobby, params.productName),
      sceneNouns.length ? `Scene: ${sceneNouns.join(", ")}` : "",
      roleHint,
      "Photorealistic, square-friendly composition, no text overlay or logos",
    ]
      .filter(Boolean)
      .join(". "),
  };
}

/** Resolve a thread image via topic-aware scrape/stock, then persist to Supabase. */
export async function generateThreadImage(params: {
  territory: string;
  angle: string;
  threadText: string;
  productName?: string;
  hobby?: string;
  postIndex: number;
  userId: string;
  supabase: SupabaseClient;
  scrapeUrl?: string;
  scrapeUrls?: string[];
  excludeUrls?: string[];
}): Promise<string | null> {
  const prompt = buildThreadImagePrompt(params);

  try {
    const resolved = await resolveFastImageUrl({
      title: prompt.title,
      subject: prompt.subject,
      hobby: params.hobby?.trim() || params.territory,
      scrapeUrl: params.scrapeUrl,
      scrapeUrls: params.scrapeUrls,
      scrapeKeywords: prompt.keywords,
      pickOffset: params.postIndex,
      seedBoost: params.postIndex * 5 + prompt.keywords.length,
      excludeUrls: params.excludeUrls,
      customQuery: prompt.stockQuery,
      orientation: "all",
      preferSquare: true,
      preferStock: prompt.preferStock,
    });

    if (!resolved.url) return null;

    const persisted = await persistExternalImage({
      url: resolved.url,
      userId: params.userId,
      supabase: params.supabase,
    });
    return persisted ?? resolved.url;
  } catch {
    return null;
  }
}

/** Generate images for multiple thread posts — each unique and post-specific. */
export async function generateThreadImagesForPosts(params: {
  posts: { text: string; angle: string }[];
  postIndexes: readonly number[];
  territory: string;
  productName?: string;
  hobby?: string;
  userId: string;
  supabase: SupabaseClient;
  scrapeUrl?: string;
  scrapeUrls?: string[];
}): Promise<(string | null)[]> {
  const usedUrls: string[] = [];
  const results: (string | null)[] = [];

  for (const postIndex of params.postIndexes) {
    const post = params.posts[postIndex];
    if (!post) {
      results.push(null);
      continue;
    }

    const imageUrl = await generateThreadImage({
      territory: params.territory,
      angle: post.angle,
      threadText: post.text,
      productName: params.productName,
      hobby: params.hobby,
      postIndex,
      userId: params.userId,
      supabase: params.supabase,
      scrapeUrl: params.scrapeUrl,
      scrapeUrls: params.scrapeUrls,
      excludeUrls: usedUrls,
    });

    if (imageUrl) {
      usedUrls.push(imageUrl);
      usedUrls.push(normalizeImageUrl(imageUrl));
    }
    results.push(imageUrl);
  }

  return results;
}
