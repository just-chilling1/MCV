import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildHeroImagePrompt } from "./prompts";
import { mapWithConcurrency } from "./concurrency";
import { SiteImagePool } from "./site-image-pool";
import { scrapeImageFromUrl, scrapeRelevantImagesFromUrl, SCRAPE_USER_AGENT } from "./scrape";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? "";
const RAPIDAPI_IMAGE_HOST =
  process.env.RAPIDAPI_IMAGE_HOST ?? "google-nano-banana4.p.rapidapi.com";
const RAPIDAPI_IMAGE_CREATE_PATH =
  process.env.RAPIDAPI_IMAGE_CREATE_PATH ?? "index.php";
const RAPIDAPI_IMAGE_OUTPUT_PATH =
  process.env.RAPIDAPI_IMAGE_OUTPUT_PATH ?? "index.php";
const RAPIDAPI_IMAGE_OUTPUT_QUERY =
  process.env.RAPIDAPI_IMAGE_OUTPUT_QUERY ?? "id";

// PR Labs (chatgpt-42) text-to-image — same RapidAPI key/subscription as text.
const RAPIDAPI_TEXT_HOST = process.env.RAPIDAPI_HOST ?? "chatgpt-42.p.rapidapi.com";
const RAPIDAPI_TEXTTOIMAGE_PATH = process.env.RAPIDAPI_TEXTTOIMAGE_PATH ?? "texttoimage3";
const TEXTTOIMAGE_TIMEOUT_MS = 45_000;

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY ?? "";
const PIXABAY_TIMEOUT_MS = 5_000;
const SCRAPE_IMAGE_TIMEOUT_MS = 15_000;

const NANO_TIMEOUT_MS = 12_000;
const ULTRA_FAST_CREATE_TIMEOUT_MS = 25_000;
const ULTRA_FAST_POLL_TIMEOUT_MS = 8_000;
const ULTRA_FAST_MAX_POLLS = 20;
const ULTRA_FAST_POLL_INTERVAL_MS = 1_500;
const POLLINATIONS_TIMEOUT_MS = 10_000;
const FAST_POLLINATIONS_TIMEOUT_MS = 7_000;
const FAST_PICSUM_TIMEOUT_MS = 4_000;

export const IMAGE_RESOLUTION_CONCURRENCY = Number(
  process.env.IMAGE_RESOLUTION_CONCURRENCY ?? 4
);

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "for", "to", "of", "in", "on", "with", "your",
  "best", "top", "guide", "review", "reviews", "vs", "under", "how", "what",
  "why", "is", "are", "buyers", "buyer", "buying", "tips", "avoid", "mistakes",
  "honest", "worth", "picks", "week", "simple", "plan", "first", "beginner",
  "beginners", "advanced", "pro", "insider", "maximize", "results", "budget",
  "growth", "tools", "tool", "magic", "tube", "2026", "2025", "2024",
]);

/** Visual search phrases that match what stock libraries actually have. */
export const HOBBY_VISUAL_QUERIES: Record<string, string> = {
  "YouTube / AI Tools": "youtube creator video editing laptop studio",
  "Pet Training": "dog training happy owner puppy",
  "Health Supplements": "health wellness vitamins supplements",
  "Online Education": "online learning student laptop classroom",
  "Financial Education": "personal finance budget planning desk",
  "Presentations / Software": "business presentation laptop office",
  "Affiliate Marketing": "online business entrepreneur laptop",
  "Dating / Relationships": "happy couple relationship together",
  "AI Writing Tools": "writer laptop content creation desk",
  "AI Platform": "artificial intelligence technology computer office",
};

function tokenizeForQuery(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

/** Build a concise Pixabay search query — hobby visuals first, not product brand names. */
function buildPixabayQuery(title: string, subject: string, hobby?: string): string {
  const hobbyHint = hobby?.trim() ? HOBBY_VISUAL_QUERIES[hobby.trim()] : undefined;
  const subjectTokens = new Set(tokenizeForQuery(subject));
  const titleTokens = tokenizeForQuery(title).filter((w) => !subjectTokens.has(w));

  if (hobbyHint) {
    const extra = titleTokens.slice(0, 2).join(" ");
    return `${hobbyHint}${extra ? ` ${extra}` : ""}`.slice(0, 100);
  }

  const words = tokenizeForQuery(`${subject} ${title}`);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    unique.push(w);
    if (unique.length >= 5) break;
  }

  return unique.join(" ").slice(0, 100);
}

interface PixabayHit {
  id?: number;
  largeImageURL?: string;
  webformatURL?: string;
  imageWidth?: number;
  imageHeight?: number;
}

interface ImagePickOptions {
  pickOffset?: number;
  excludeUrls?: string[];
  excludeStockIds?: string[];
  hobby?: string;
  /** Extra seed variation (e.g. post index) so similar titles pick different hits. */
  seedBoost?: number;
  /** Override the built Pixabay query string. */
  customQuery?: string;
  orientation?: "horizontal" | "vertical" | "all";
  /** Prefer roughly square hits — useful for social thread cards. */
  preferSquare?: boolean;
  /** When set, try stock photos before scraping the affiliate page. */
  preferStock?: boolean;
}

export interface StockImageResult {
  url: string;
  stockId: string;
}

export function normalizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

function isExcludedUrl(url: string, excludeUrls: string[]): boolean {
  const key = normalizeImageUrl(url);
  return excludeUrls.some((ex) => normalizeImageUrl(ex) === key || ex === url);
}

function stockIdForHit(hit: PixabayHit, imageUrl: string): string {
  return hit.id ? `pixabay:${hit.id}` : normalizeImageUrl(imageUrl);
}

/**
 * Look up a relevant free stock photo from Pixabay.
 */
export async function fetchPixabayImage(
  title: string,
  subject: string,
  options?: ImagePickOptions
): Promise<StockImageResult | null> {
  if (!PIXABAY_API_KEY) {
    console.warn("[images] PIXABAY_API_KEY not set — skipping stock photos");
    return null;
  }

  const query =
    options?.customQuery?.trim() ||
    buildPixabayQuery(title, subject, options?.hobby);
  if (!query) return null;

  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", PIXABAY_API_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", options?.orientation ?? "horizontal");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("order", "popular");
  url.searchParams.set("per_page", "40");
  url.searchParams.set("min_width", "800");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(PIXABAY_TIMEOUT_MS) });
    if (!response.ok) return null;

    const data = (await response.json()) as { hits?: PixabayHit[] };
    let hits = (data.hits ?? []).filter((h) => h.largeImageURL || h.webformatURL);

    if (options?.preferSquare) {
      const squareish = hits.filter((h) => {
        const w = h.imageWidth ?? 0;
        const hgt = h.imageHeight ?? 1;
        const ratio = w / hgt;
        return ratio > 0.75 && ratio < 1.33;
      });
      if (squareish.length > 0) hits = squareish;
    } else {
      hits = hits.filter((h) => (h.imageWidth ?? 0) >= (h.imageHeight ?? 1));
    }
    if (hits.length === 0) return null;

    const seed =
      title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + (options?.seedBoost ?? 0) * 17;
    const offset = options?.pickOffset ?? 0;
    const exclude = options?.excludeUrls ?? [];
    const excludeIds = new Set(options?.excludeStockIds ?? []);

    for (let i = 0; i < hits.length; i++) {
      const hit = hits[(seed + offset + i) % hits.length];
      const imageUrl = hit.largeImageURL || hit.webformatURL || null;
      if (!imageUrl) continue;
      const stockId = stockIdForHit(hit, imageUrl);
      if (excludeIds.has(stockId)) continue;
      if (isExcludedUrl(imageUrl, exclude)) continue;
      console.info("[images] pixabay hit", query.slice(0, 48));
      return { url: imageUrl, stockId };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchPixabayImageUrl(
  title: string,
  subject: string,
  options?: ImagePickOptions
): Promise<string | null> {
  const hit = await fetchPixabayImage(title, subject, options);
  return hit?.url ?? null;
}

export function pollinationsImageUrl(title: string, subject: string, seedOffset = 0): string {
  const prompt = buildHeroImagePrompt(title, subject);

  const seed =
    title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + seedOffset;

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=800&seed=${seed}&nologo=true`;
}

function picsumFallbackUrl(title: string, seedOffset = 0): string {
  const seed = title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + seedOffset;
  return `https://picsum.photos/seed/sms-${seed}/1200/800`;
}

function findBase64InResponse(val: unknown, depth = 0): string | null {
  if (depth > 8 || val == null) return null;
  if (typeof val === "string") {
    const s = val.trim();
    if (s.startsWith("data:image")) {
      const comma = s.indexOf(",");
      return comma !== -1 ? s.slice(comma + 1) : null;
    }
    const compact = s.replace(/\s/g, "");
    if (compact.length > 200 && /^[A-Za-z0-9+/]+=*$/.test(compact)) {
      return compact;
    }
    return null;
  }
  if (Array.isArray(val)) {
    for (const item of val) {
      const found = findBase64InResponse(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof val === "object") {
    for (const v of Object.values(val as Record<string, unknown>)) {
      const found = findBase64InResponse(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function isUltraFastNanoBananaHost(host: string): boolean {
  return host.includes("ultra-fast-nano-banana");
}

function rapidApiHeaders(host: string): Record<string, string> {
  return {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": host,
    "Content-Type": "application/json",
  };
}

function findRemoteImageUrl(val: unknown, depth = 0): string | null {
  if (depth > 8 || val == null) return null;

  if (typeof val === "string") {
    const s = val.trim();
    if (/^https?:\/\//i.test(s) && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(s)) {
      return s;
    }
    if (/^https?:\/\//i.test(s) && s.includes("image")) return s;
    return null;
  }

  if (Array.isArray(val)) {
    for (const item of val) {
      const found = findRemoteImageUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const preferredKeys = [
      "imageUrl",
      "image_url",
      "resultImageUrl",
      "result_image_url",
      "output_url",
      "url",
      "image",
    ];
    for (const key of preferredKeys) {
      const v = obj[key];
      if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
    }
    for (const v of Object.values(obj)) {
      const found = findRemoteImageUrl(v, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

function findTaskId(val: unknown, depth = 0): string | null {
  if (depth > 8 || val == null) return null;

  if (typeof val === "object" && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    const preferredKeys = ["task_id", "taskId", "request_id", "requestId", "id", "job_id"];
    for (const key of preferredKeys) {
      const v = obj[key];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
    }
    for (const v of Object.values(obj)) {
      const found = findTaskId(v, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

async function bufferFromRapidApiImageResponse(data: unknown): Promise<Buffer | null> {
  const b64 = findBase64InResponse(data);
  if (b64) return Buffer.from(b64, "base64");

  const remoteUrl = findRemoteImageUrl(data);
  if (remoteUrl) return fetchImageBuffer(remoteUrl, 15_000);

  return null;
}

export function looksLikeImageBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (buffer.subarray(0, 8).toString("ascii") === "\x89PNG\r\n\x1a\n") return true;
  const gif = buffer.subarray(0, 6).toString("ascii");
  if (gif === "GIF87a" || gif === "GIF89a") return true;
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return true;
  }
  // AVIF: ISO BMFF with 'ftyp' and an avif/avis brand
  if (
    buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
    /avif|avis|mif1|miaf/i.test(buffer.subarray(8, 16).toString("ascii"))
  ) {
    return true;
  }
  return false;
}

/** Content-Type derived from magic bytes; null when the buffer is not a known image. */
export function sniffImageContentType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).toString("ascii") === "\x89PNG\r\n\x1a\n") return "image/png";
  const gif = buffer.subarray(0, 6).toString("ascii");
  if (gif === "GIF87a" || gif === "GIF89a") return "image/gif";
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
    /avif|avis|mif1|miaf/i.test(buffer.subarray(8, 16).toString("ascii"))
  ) {
    return "image/avif";
  }
  return null;
}

function urlLooksLikeImage(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|avif|bmp)(\?|$)/i.test(url) || /\/image/i.test(url);
}

async function fetchImageBuffer(
  url: string,
  timeoutMs: number,
  referer?: string
): Promise<Buffer | null> {
  try {
    const { fetchPublicHttp } = await import("@/lib/safe-url");

    const headers: Record<string, string> = {
      "User-Agent": SCRAPE_USER_AGENT,
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    };
    if (referer) headers.Referer = referer;

    const response = await fetchPublicHttp(url, {
      allowHttp: true,
      signal: AbortSignal.timeout(timeoutMs),
      headers,
    });
    if (!response.ok) return null;
    const type = (response.headers.get("content-type") ?? "").toLowerCase();
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 800) return null;

    if (type.startsWith("image/")) return buffer;
    if (type.includes("octet-stream") && (urlLooksLikeImage(url) || looksLikeImageBytes(buffer))) {
      return buffer;
    }
    if (!type || type.includes("binary")) {
      if (looksLikeImageBytes(buffer) || urlLooksLikeImage(url)) return buffer;
    }
    return null;
  } catch {
    return null;
  }
}

/** Scrape og:image / product image from a page via ScraperAPI. Returns null when unavailable. */
async function resolveScrapedImage(
  scrapeUrl: string
): Promise<{ url: string; buffer: Buffer } | null> {
  try {
    const url = await scrapeImageFromUrl(scrapeUrl);
    if (!url) return null;
    const buffer = await fetchImageBuffer(url, SCRAPE_IMAGE_TIMEOUT_MS, scrapeUrl);
    if (!buffer || buffer.length < 800) return null;
    console.info("[images] scraped page image", scrapeUrl.slice(0, 64));
    return { url, buffer };
  } catch {
    return null;
  }
}

async function fetchScrapedImageUrl(
  scrapeUrl: string,
  scrapeKeywords?: string[],
  pickOffset = 0
): Promise<string | null> {
  if (scrapeKeywords && scrapeKeywords.length > 0) {
    const ranked = await scrapeRelevantImagesFromUrl(scrapeUrl, {
      keywords: scrapeKeywords,
      limit: 8,
    });
    for (let i = 0; i < ranked.length; i++) {
      const candidate = ranked[(pickOffset + i) % ranked.length];
      const buffer = await fetchImageBuffer(candidate, SCRAPE_IMAGE_TIMEOUT_MS, scrapeUrl);
      if (buffer && buffer.length >= 800) {
        console.info("[images] scraped relevant page image", scrapeUrl.slice(0, 64));
        return candidate;
      }
    }
  }

  const scraped = await resolveScrapedImage(scrapeUrl);
  return scraped?.url ?? null;
}

async function fetchScrapedImageBuffer(scrapeUrl: string): Promise<Buffer | null> {
  const scraped = await resolveScrapedImage(scrapeUrl);
  return scraped?.buffer ?? null;
}

async function pollUltraFastOutput(taskId: string): Promise<Buffer | null> {
  const queryKeys = [
    RAPIDAPI_IMAGE_OUTPUT_QUERY,
    "task_id",
    "taskId",
    "id",
    "request_id",
  ].filter((key, index, arr) => arr.indexOf(key) === index);

  for (let attempt = 0; attempt < ULTRA_FAST_MAX_POLLS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, ULTRA_FAST_POLL_INTERVAL_MS));
    }

    for (const queryKey of queryKeys) {
      const url = new URL(`https://${RAPIDAPI_IMAGE_HOST}/${RAPIDAPI_IMAGE_OUTPUT_PATH}`);
      url.searchParams.set(queryKey, taskId);

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: rapidApiHeaders(RAPIDAPI_IMAGE_HOST),
          signal: AbortSignal.timeout(ULTRA_FAST_POLL_TIMEOUT_MS),
        });
        if (!response.ok) continue;

        const data = await response.json();
        if (typeof data === "object" && data && "success" in data && data.success === false) {
          continue;
        }

        const buffer = await bufferFromRapidApiImageResponse(data);
        if (buffer) return buffer;
      } catch {
        /* try next query key / poll */
      }
    }
  }

  return null;
}

async function callUltraFastNanoBanana(
  prompt: string,
  negativePrompt: string,
  referenceImageUrl: string
): Promise<Buffer | null> {
  if (!RAPIDAPI_KEY) return null;

  const fullPrompt = negativePrompt
    ? `${prompt.slice(0, 450)}\n\nAvoid: ${negativePrompt.slice(0, 200)}`
    : prompt.slice(0, 500);

  try {
    const response = await fetch(
      `https://${RAPIDAPI_IMAGE_HOST}/${RAPIDAPI_IMAGE_CREATE_PATH}`,
      {
        method: "POST",
        headers: rapidApiHeaders(RAPIDAPI_IMAGE_HOST),
        body: JSON.stringify({
          prompt: fullPrompt,
          image_urls: [referenceImageUrl],
        }),
        signal: AbortSignal.timeout(ULTRA_FAST_CREATE_TIMEOUT_MS),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (typeof data === "object" && data && "success" in data && data.success === false) {
      return null;
    }

    const immediate = await bufferFromRapidApiImageResponse(data);
    if (immediate) return immediate;

    const taskId = findTaskId(data);
    if (taskId) return pollUltraFastOutput(taskId);
  } catch {
    return null;
  }

  return null;
}

async function callLegacyNanoBanana(
  prompt: string,
  negativePrompt: string
): Promise<Buffer | null> {
  if (!RAPIDAPI_KEY) return null;

  try {
    const response = await fetch(`https://${RAPIDAPI_IMAGE_HOST}/txt-to-img`, {
      method: "POST",
      headers: rapidApiHeaders(RAPIDAPI_IMAGE_HOST),
      body: JSON.stringify({
        prompt: prompt.slice(0, 500),
        negative_prompt: negativePrompt.slice(0, 300),
      }),
      signal: AbortSignal.timeout(NANO_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return bufferFromRapidApiImageResponse(data);
  } catch {
    return null;
  }
}

async function callRapidApiImage(params: {
  prompt: string;
  negativePrompt: string;
  referenceImageUrl: string;
}): Promise<Buffer | null> {
  if (!RAPIDAPI_KEY) return null;

  if (isUltraFastNanoBananaHost(RAPIDAPI_IMAGE_HOST)) {
    return callUltraFastNanoBanana(
      params.prompt,
      params.negativePrompt,
      params.referenceImageUrl
    );
  }

  return callLegacyNanoBanana(params.prompt, params.negativePrompt);
}

/**
 * Generate an image via the PR Labs (chatgpt-42) text-to-image endpoint using
 * the same RapidAPI key as text generation. Returns the hosted image URL.
 * NOTE: shares the account's per-second rate limit with article text calls.
 */
async function prLabsImageUrl(prompt: string): Promise<string | null> {
  if (!RAPIDAPI_KEY) return null;
  try {
    const res = await fetch(`https://${RAPIDAPI_TEXT_HOST}/${RAPIDAPI_TEXTTOIMAGE_PATH}`, {
      method: "POST",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_TEXT_HOST,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: prompt.slice(0, 500), width: 1024, height: 768 }),
      signal: AbortSignal.timeout(TEXTTOIMAGE_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const url =
      typeof (data as { generated_image?: unknown })?.generated_image === "string"
        ? (data as { generated_image: string }).generated_image
        : findRemoteImageUrl(data);
    return url && /^https?:\/\//i.test(url) ? url : null;
  } catch {
    return null;
  }
}

async function prLabsImageBuffer(prompt: string): Promise<Buffer | null> {
  const url = await prLabsImageUrl(prompt);
  return url ? fetchImageBuffer(url, 20_000) : null;
}

async function uploadToBlogImages(
  supabase: SupabaseClient,
  userId: string,
  buffer: Buffer,
  ext: "png" | "jpg" = "jpg"
): Promise<string | null> {
  const fileName = `${userId}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, buffer, {
      contentType: ext === "png" ? "image/png" : "image/jpeg",
      upsert: false,
    });

  if (error) return null;
  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}

const CONTENT_TYPE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export function isSupportedImageType(contentType: string): boolean {
  return contentType.toLowerCase() in CONTENT_TYPE_EXT;
}

/**
 * Persist a user-uploaded image to the `blog-images` bucket and return its
 * public URL. Used by the manual image upload / replace flow in the editor.
 */
export async function uploadUserImage(params: {
  supabase: SupabaseClient;
  userId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string | null> {
  const ext = CONTENT_TYPE_EXT[params.contentType.toLowerCase()] ?? "jpg";
  const fileName = `${params.userId}/uploads/${randomUUID()}.${ext}`;
  const { error } = await params.supabase.storage
    .from("blog-images")
    .upload(fileName, params.buffer, {
      contentType: params.contentType,
      upsert: false,
    });

  if (error) return null;
  const { data } = params.supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export interface ResolvedImage {
  url: string;
  alt: string;
  stockId?: string;
}

/**
 * FAST path: return a directly-usable image URL with NO download/upload.
 */
async function resolveStockImageUrl(
  params: {
    title: string;
    subject: string;
    hobby?: string;
    pickOffset?: number;
    seedBoost?: number;
    excludeUrls?: string[];
    excludeStockIds?: string[];
    customQuery?: string;
    orientation?: "horizontal" | "vertical" | "all";
    preferSquare?: boolean;
  },
  exclude: string[],
  excludeStockIds: string[]
): Promise<string | null> {
  return fetchPixabayImageUrl(params.title, params.subject, {
    pickOffset: params.pickOffset,
    seedBoost: params.seedBoost,
    excludeUrls: exclude,
    excludeStockIds,
    hobby: params.hobby,
    customQuery: params.customQuery,
    orientation: params.orientation ?? "all",
    preferSquare: params.preferSquare ?? false,
  });
}

async function resolveScrapedImageUrl(
  scrapeUrl: string,
  scrapeKeywords: string[] | undefined,
  offset: number,
  exclude: string[]
): Promise<string | null> {
  const scraped = await fetchScrapedImageUrl(scrapeUrl, scrapeKeywords, offset);
  if (scraped && !isExcludedUrl(scraped, exclude)) return scraped;
  return null;
}

export async function resolveFastImageUrl(params: {
  title: string;
  subject: string;
  hobby?: string;
  /** Affiliate/product page to scrape for og:image. */
  scrapeUrl?: string;
  /** Extra pages (e.g. offer page) to scrape when the primary URL has no match. */
  scrapeUrls?: string[];
  /** Keywords from the thread post — used to rank scraped page images. */
  scrapeKeywords?: string[];
  pickOffset?: number;
  seedBoost?: number;
  excludeUrls?: string[];
  excludeStockIds?: string[];
  customQuery?: string;
  orientation?: "horizontal" | "vertical" | "all";
  preferSquare?: boolean;
  /** Story/lifestyle posts: stock first. Product/proof posts: scrape first (default). */
  preferStock?: boolean;
}): Promise<ResolvedImage> {
  const alt = `${params.title} — ${params.subject}`;
  const offset = params.pickOffset ?? 0;
  const exclude = params.excludeUrls ?? [];
  const excludeStockIds = params.excludeStockIds ?? [];
  const stockParams = {
    title: params.title,
    subject: params.subject,
    hobby: params.hobby,
    pickOffset: offset,
    seedBoost: params.seedBoost,
    customQuery: params.customQuery,
    orientation: params.orientation,
    preferSquare: params.preferSquare,
  };

  const tryStock = () =>
    resolveStockImageUrl(stockParams, exclude, excludeStockIds);

  const scrapeTargets = [
    params.scrapeUrl,
    ...(params.scrapeUrls ?? []),
  ].filter((url): url is string => Boolean(url?.trim()));

  const tryScrape = async () => {
    for (let i = 0; i < scrapeTargets.length; i++) {
      const scraped = await resolveScrapedImageUrl(
        scrapeTargets[i],
        params.scrapeKeywords,
        offset + i,
        exclude
      );
      if (scraped) return scraped;
    }
    return null;
  };

  const stockFirst = params.preferStock === true;
  const primary = stockFirst ? await tryStock() : await tryScrape();
  if (primary) {
    return { url: primary, alt, stockId: normalizeImageUrl(primary) };
  }

  const fallback = stockFirst ? await tryScrape() : await tryStock();
  if (fallback) {
    return { url: fallback, alt, stockId: normalizeImageUrl(fallback) };
  }

  const picsum = picsumFallbackUrl(params.title, offset + (params.seedBoost ?? 0));
  return { url: picsum, alt, stockId: normalizeImageUrl(picsum) };
}

/** Prefetch hero images for all cluster topics (unique per site generation). */
export async function prefetchTopicImages(
  topics: ReadonlyArray<{ title: string; slug: string }>,
  subject: string,
  hobby?: string,
  concurrency = IMAGE_RESOLUTION_CONCURRENCY,
  scrapeUrl?: string
): Promise<Record<string, ResolvedImage>> {
  const pool = new SiteImagePool();
  const pairs = await mapWithConcurrency(topics, concurrency, async (topic, i) => {
    const image = await pool.resolveUnique({
      title: topic.title,
      subject,
      hobby,
      scrapeUrl,
      seedBoost: i,
      pickOffset: 0,
    });
    return [topic.slug, image] as const;
  });

  const out: Record<string, ResolvedImage> = {};
  for (const [slug, image] of pairs) {
    if (image.url) out[slug] = image;
  }
  return out;
}

/**
 * Download an external image URL and cache it to Supabase Storage.
 * Returns the new public URL, or null on failure (caller keeps the original).
 */
export async function persistExternalImage(params: {
  url: string;
  userId: string;
  supabase: SupabaseClient;
}): Promise<string | null> {
  if (!params.url || params.url.includes("/blog-images/")) return null;
  const buffer = await fetchImageBuffer(params.url, 20_000);
  if (!buffer) return null;
  return uploadToBlogImages(params.supabase, params.userId, buffer);
}

/**
 * Always returns a Supabase-hosted URL (scrape → stock photo → placeholder).
 */
export async function resolvePostImage(params: {
  title: string;
  subject: string;
  userId: string;
  supabase: SupabaseClient;
  /** Affiliate/product page to scrape for og:image. */
  scrapeUrl?: string;
  /** @deprecated AI image generation is disabled; kept for API compatibility. */
  fast?: boolean;
}): Promise<{ url: string; alt: string }> {
  const alt = `${params.title} — ${params.subject}`;

  const scrapeSource = async (): Promise<Buffer | null> =>
    params.scrapeUrl ? fetchScrapedImageBuffer(params.scrapeUrl) : null;

  const pixabaySource = async (): Promise<Buffer | null> => {
    const hit = await fetchPixabayImage(params.title, params.subject);
    if (!hit) return null;
    return fetchImageBuffer(hit.url, PIXABAY_TIMEOUT_MS + 5_000);
  };

  const sources: Array<() => Promise<Buffer | null>> = [
    scrapeSource,
    pixabaySource,
    () => fetchImageBuffer(picsumFallbackUrl(params.title), FAST_PICSUM_TIMEOUT_MS),
  ];

  for (const load of sources) {
    const buffer = await load();
    if (!buffer) continue;
    const url = await uploadToBlogImages(params.supabase, params.userId, buffer);
    if (url) return { url, alt };
  }

  // Never return an imageless post: picsum is a reliable, whitelisted host so a
  // hero always renders even if scrape/stock/upload all failed.
  return { url: picsumFallbackUrl(params.title), alt };
}
