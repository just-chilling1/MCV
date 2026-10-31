import * as cheerio from "cheerio";
import { assertPublicHttpsUrlResolved, fetchPublicHttp } from "@/lib/safe-url";

export interface ScrapedPageInfo {
  title: string;
  description: string;
  h1: string;
  price: string;
  brand: string;
  rating: string;
  features: string[];
  bodySnippet: string;
  /** og:image / JSON-LD product image when present on the page. */
  imageUrl: string;
}

const SCRAPER_API_TIMEOUT_MS = 30_000;
const DIRECT_FETCH_TIMEOUT_MS = 10_000;
export const SCRAPE_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function getScraperApiKey(): string | undefined {
  return (process.env.SCRAPER_API_KEY || process.env.SCRAPERAPI_KEY)?.trim() || undefined;
}

async function fetchDirectHtml(url: string): Promise<string | null> {
  try {
    const res = await fetchPublicHttp(url, {
      method: "GET",
      headers: { "User-Agent": SCRAPE_USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(DIRECT_FETCH_TIMEOUT_MS),
    });
    if (res.ok) return await res.text();
  } catch {
    /* fall through */
  }
  return null;
}

async function fetchScraperApiHtml(
  url: string,
  options?: { render?: boolean; premium?: boolean }
): Promise<string | null> {
  const scraperApiKey = getScraperApiKey();
  if (!scraperApiKey) return null;

  try {
    const params = new URLSearchParams({
      api_key: scraperApiKey,
      url,
    });
    if (options?.render) params.set("render", "true");
    if (options?.premium) params.set("premium", "true");
    const scraperUrl = `https://api.scraperapi.com?${params.toString()}`;
    // JS render is slow (~15–30s); plain HTML fetch stays under ~10s.
    const timeoutMs = options?.render ? SCRAPER_API_TIMEOUT_MS : 12_000;
    const res = await fetch(scraperUrl, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return await res.text();
  } catch {
    /* fall through */
  }
  return null;
}

function htmlHasOfferSignals(html: string): boolean {
  const lower = html.slice(0, 8000).toLowerCase();
  return (
    lower.includes("<title") &&
    (lower.includes("og:title") ||
      lower.includes('name="description"') ||
      lower.includes("<h1") ||
      lower.includes("application/ld+json"))
  );
}

/** Fetch raw HTML — direct → ScraperAPI (no JS) → ScraperAPI JS render. */
async function fetchHtml(url: string): Promise<string | null> {
  const direct = await fetchDirectHtml(url);
  if (direct && htmlHasOfferSignals(direct)) return direct;

  const plain = await fetchScraperApiHtml(url);
  if (plain && htmlHasOfferSignals(plain)) return plain;

  const rendered = await fetchScraperApiHtml(url, { render: true, premium: true });
  if (rendered) return rendered;

  return plain || direct;
}

type JsonLdNode = Record<string, unknown>;

/** Walk JSON-LD blocks looking for a Product node and pull structured fields. */
function extractFromJsonLd($: cheerio.CheerioAPI): Partial<ScrapedPageInfo> {
  const out: Partial<ScrapedPageInfo> = {};

  const nodes: JsonLdNode[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (item && typeof item === "object") {
          nodes.push(item as JsonLdNode);
          const graph = (item as JsonLdNode)["@graph"];
          if (Array.isArray(graph)) nodes.push(...(graph as JsonLdNode[]));
        }
      }
    } catch {
      /* ignore malformed blocks */
    }
  });

  const typeMatches = (node: JsonLdNode, type: string) => {
    const t = node["@type"];
    return Array.isArray(t) ? t.includes(type) : t === type;
  };

  const product = nodes.find((n) => typeMatches(n, "Product"));
  if (product) {
    if (typeof product.name === "string") out.title = product.name.trim();
    if (typeof product.description === "string") out.description = product.description.trim();

    const brand = product.brand;
    if (typeof brand === "string") out.brand = brand;
    else if (brand && typeof brand === "object" && typeof (brand as JsonLdNode).name === "string") {
      out.brand = (brand as JsonLdNode).name as string;
    }

    const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
    if (offers && typeof offers === "object") {
      const o = offers as JsonLdNode;
      const price = o.price ?? o.lowPrice;
      const currency = typeof o.priceCurrency === "string" ? o.priceCurrency : "";
      if (price != null && `${price}`.trim()) out.price = `${currency} ${price}`.trim();
    }

    const rating = product.aggregateRating;
    if (rating && typeof rating === "object") {
      const r = rating as JsonLdNode;
      if (r.ratingValue != null) {
        const count = r.reviewCount ?? r.ratingCount;
        out.rating = count != null ? `${r.ratingValue}/5 from ${count} reviews` : `${r.ratingValue}/5`;
      }
    }
  }

  return out;
}

function metaContent($: cheerio.CheerioAPI, selectors: string[]): string {
  for (const sel of selectors) {
    const val = $(sel).attr("content");
    if (val && val.trim()) return val.replace(/\s+/g, " ").trim();
  }
  return "";
}

function resolveAbsoluteUrl(pageUrl: string, href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  try {
    return new URL(trimmed, pageUrl).toString();
  } catch {
    return null;
  }
}

function normalizeImageCandidate(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function jsonLdImageUrl(value: unknown): string {
  if (typeof value === "string") return normalizeImageCandidate(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = jsonLdImageUrl(item);
      if (url) return url;
    }
    return "";
  }
  if (value && typeof value === "object") {
    const node = value as JsonLdNode;
    if (typeof node.url === "string") return normalizeImageCandidate(node.url);
    if (typeof node.contentUrl === "string") return normalizeImageCandidate(node.contentUrl);
    if (typeof node["@id"] === "string" && /^https?:\/\//i.test(node["@id"])) {
      return normalizeImageCandidate(node["@id"]);
    }
  }
  return "";
}

function extractImageFromJsonLd($: cheerio.CheerioAPI): string {
  const nodes: JsonLdNode[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (item && typeof item === "object") {
          nodes.push(item as JsonLdNode);
          const graph = (item as JsonLdNode)["@graph"];
          if (Array.isArray(graph)) nodes.push(...(graph as JsonLdNode[]));
        }
      }
    } catch {
      /* ignore malformed blocks */
    }
  });

  const typeMatches = (node: JsonLdNode, type: string) => {
    const t = node["@type"];
    return Array.isArray(t) ? t.includes(type) : t === type;
  };

  for (const node of nodes) {
    if (!typeMatches(node, "Product") && !typeMatches(node, "ImageObject")) continue;
    const imageUrl = jsonLdImageUrl(node.image ?? node.contentUrl ?? node.url);
    if (imageUrl) return imageUrl;
  }

  return "";
}

/** Pull the best product/hero image URL from rendered HTML. */
export function extractPageImageUrl(html: string, pageUrl: string): string | null {
  const $ = cheerio.load(html);
  const candidates = [
    metaContent($, [
      'meta[property="og:image:secure_url"]',
      'meta[property="og:image"]',
      'meta[property="og:image:url"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
    ]),
    $('link[rel="image_src"]').attr("href") ?? "",
    extractImageFromJsonLd($),
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const abs = resolveAbsoluteUrl(pageUrl, raw);
    if (abs && /^https?:\/\//i.test(abs)) return abs;
  }

  return null;
}

const JUNK_IMAGE_PATTERN =
  /(?:logo|icon|avatar|badge|sprite|pixel|tracking|spacer|1x1|emoji|favicon|banner-ad|placeholder)/i;

export interface RankedPageImage {
  url: string;
  score: number;
  source: string;
}

function scoreImageCandidate(params: {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  sourceWeight: number;
  keywords: string[];
}): number {
  let score = params.sourceWeight;
  const haystack = `${params.url} ${params.alt ?? ""}`.toLowerCase();

  if (JUNK_IMAGE_PATTERN.test(haystack)) score -= 80;
  if (params.width && params.height) {
    if (params.width < 240 || params.height < 240) score -= 50;
    const ratio = params.width / params.height;
    if (ratio > 0.85 && ratio < 1.15) score += 18;
    if (params.width >= 800 || params.height >= 800) score += 12;
  }

  for (const keyword of params.keywords) {
    if (keyword.length > 2 && haystack.includes(keyword)) score += 18;
  }

  // Boost when multiple keywords match — signals a post-specific image, not a generic hero.
  const matchCount = params.keywords.filter(
    (keyword) => keyword.length > 2 && haystack.includes(keyword)
  ).length;
  if (matchCount >= 2) score += matchCount * 6;

  return score;
}

/** Rank every usable image on a page — meta tags, JSON-LD, and in-content photos. */
export function rankPageImages(
  html: string,
  pageUrl: string,
  keywords: string[] = []
): RankedPageImage[] {
  const $ = cheerio.load(html);
  const ranked: RankedPageImage[] = [];
  const seen = new Set<string>();

  const add = (
    raw: string,
    sourceWeight: number,
    source: string,
    alt?: string,
    width?: number,
    height?: number
  ) => {
    if (!raw?.trim()) return;
    const abs = resolveAbsoluteUrl(pageUrl, raw);
    if (!abs || !/^https?:\/\//i.test(abs)) return;
    const key = abs.split("?")[0] ?? abs;
    if (seen.has(key)) return;
    seen.add(key);
    ranked.push({
      url: abs,
      score: scoreImageCandidate({ url: abs, alt, width, height, sourceWeight, keywords }),
      source,
    });
  };

  add(
    metaContent($, [
      'meta[property="og:image:secure_url"]',
      'meta[property="og:image"]',
      'meta[property="og:image:url"]',
    ]),
    100,
    "og:image"
  );
  add(
    metaContent($, ['meta[name="twitter:image"]', 'meta[name="twitter:image:src"]']),
    92,
    "twitter:image"
  );
  add($('link[rel="image_src"]').attr("href") ?? "", 88, "image_src");
  add(extractImageFromJsonLd($), 90, "jsonld");

  $("img[src]").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const alt = $(el).attr("alt") ?? "";
    const width = Number($(el).attr("width")) || undefined;
    const height = Number($(el).attr("height")) || undefined;
    add(src, 70, "content-img", alt, width, height);
  });

  return ranked.sort((a, b) => b.score - a.score);
}

/** Scrape a page and return image URLs ranked by relevance to keywords and post topic. */
export async function scrapeRelevantImagesFromUrl(
  url: string,
  options?: { keywords?: string[]; limit?: number }
): Promise<string[]> {
  let safeUrl: string;
  try {
    safeUrl = (await assertPublicHttpsUrlResolved(url)).toString();
  } catch {
    return [];
  }

  const keywords = (options?.keywords ?? [])
    .map((word) => word.toLowerCase().trim())
    .filter((word) => word.length > 2);
  const limit = options?.limit ?? 6;

  const htmlSources: string[] = [];
  const direct = await fetchDirectHtml(safeUrl);
  if (direct) htmlSources.push(direct);

  const rendered = await fetchScraperApiHtml(safeUrl);
  if (rendered && rendered !== direct) htmlSources.push(rendered);

  const ranked: RankedPageImage[] = [];
  const seen = new Set<string>();

  for (const html of htmlSources) {
    for (const candidate of rankPageImages(html, safeUrl, keywords)) {
      const key = candidate.url.split("?")[0] ?? candidate.url;
      if (seen.has(key)) continue;
      seen.add(key);
      ranked.push(candidate);
    }
  }

  return ranked
    .filter((candidate) => candidate.score > 20)
    .slice(0, limit)
    .map((candidate) => candidate.url);
}

/** Scrape an affiliate/product page and return its primary image URL, if any. */
export async function scrapeImageFromUrl(url: string): Promise<string | null> {
  let safeUrl: string;
  try {
    safeUrl = (await assertPublicHttpsUrlResolved(url)).toString();
  } catch {
    return null;
  }

  const direct = await fetchDirectHtml(safeUrl);
  if (direct) {
    const imageUrl = extractPageImageUrl(direct, safeUrl);
    if (imageUrl) return imageUrl;
  }

  // Many offer pages inject og:image via JS — retry with rendered HTML even when
  // the direct response already has title/description signals.
  const rendered = await fetchScraperApiHtml(safeUrl);
  if (rendered) {
    const imageUrl = extractPageImageUrl(rendered, safeUrl);
    if (imageUrl) return imageUrl;
  }

  return direct ? extractPageImageUrl(direct, safeUrl) : null;
}

/** Heuristic price sniff from visible text when JSON-LD has none. */
function sniffPrice(text: string): string {
  const match = text.match(/(?:[$€£]|USD|EUR)\s?\d{1,4}(?:[.,]\d{2})?/);
  return match ? match[0].trim() : "";
}

/** Collect the most "feature-like" list items (benefits/specs) on the page. */
function extractFeatures($: cheerio.CheerioAPI): string[] {
  const items: string[] = [];
  $("li").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length >= 12 && text.length <= 160 && !/^(home|login|sign|menu|cart)/i.test(text)) {
      items.push(text);
    }
  });

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= 8) break;
  }
  return unique;
}

export async function scrapePage(
  url: string,
  options?: { skipImageFallback?: boolean }
): Promise<ScrapedPageInfo | null> {
  // Defense in depth — resolve DNS so private/link-local targets cannot slip through.
  let safeUrl: string;
  try {
    safeUrl = (await assertPublicHttpsUrlResolved(url)).toString();
  } catch {
    return null;
  }

  let html = await fetchHtml(safeUrl);
  if (!html) return null;

  try {
    let imageUrl = extractPageImageUrl(html, safeUrl) ?? "";
    // Second rendered fetch is only to hunt an og:image. Callers that generate
    // their own pictures (DFY Craft) skip it — it can add another 30s.
    if (!imageUrl && !options?.skipImageFallback) {
      const rendered = await fetchScraperApiHtml(safeUrl, { render: true, premium: true });
      if (rendered) {
        const renderedImage = extractPageImageUrl(rendered, safeUrl);
        if (renderedImage) {
          imageUrl = renderedImage;
          if (!htmlHasOfferSignals(html)) html = rendered;
        }
      }
    }

    const $ = cheerio.load(html);
    $("script, style, noscript, svg").remove();

    const jsonLd = extractFromJsonLd(cheerio.load(html));

    const title =
      jsonLd.title ||
      metaContent($, ['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
      $("title").first().text().replace(/\s+/g, " ").trim();

    const description =
      jsonLd.description ||
      metaContent($, [
        'meta[name="description"]',
        'meta[property="og:description"]',
        'meta[name="twitter:description"]',
      ]);

    const h1 = $("h1").first().text().replace(/\s+/g, " ").trim();

    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 2000);

    const price = jsonLd.price || sniffPrice(bodyText);
    const features = extractFeatures($);

    return {
      title: (title || h1).slice(0, 200),
      description: description.slice(0, 600),
      h1: h1.slice(0, 200),
      price: price.slice(0, 40),
      brand: (jsonLd.brand ?? "").slice(0, 80),
      rating: (jsonLd.rating ?? "").slice(0, 60),
      features,
      bodySnippet: bodyText.slice(0, 600),
      imageUrl: imageUrl.slice(0, 2048),
    };
  } catch {
    return null;
  }
}

/** Turn scraped details into a compact, model-friendly product context block. */
export function buildProductContext(info: ScrapedPageInfo): string {
  const lines: string[] = [];
  if (info.title) lines.push(`Product: ${info.title}`);
  if (info.brand) lines.push(`Brand: ${info.brand}`);
  if (info.price) lines.push(`Price: ${info.price}`);
  if (info.rating) lines.push(`Rating: ${info.rating}`);
  if (info.description) lines.push(`Summary: ${info.description}`);
  if (info.features.length > 0) {
    lines.push(`Key points: ${info.features.slice(0, 6).join("; ")}`);
  } else if (info.bodySnippet) {
    lines.push(`Page excerpt: ${info.bodySnippet}`);
  }
  return lines.join("\n");
}
