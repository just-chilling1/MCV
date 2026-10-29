import type { ArmedLink } from "../types";
import { normalizeAffiliateUrl } from "./affiliate-url";
import { insertAfterH2 } from "./html-insert";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

export function buildTrackUrl(postId: string, siteId: string, target: string): string {
  const url = normalizeAffiliateUrl(target);
  const params = new URLSearchParams({
    post: postId,
    site: siteId,
    to: url,
  });
  return `/api/blog/track-click?${params.toString()}`;
}

const REL = 'target="_blank" rel="nofollow sponsored noopener"';

/**
 * The model is asked to place a single inline recommendation link using one of
 * these placeholder hrefs. We rewrite them to the tracked affiliate URL so the
 * link sits naturally inside the prose instead of in a bolted-on banner.
 */
const PLACEHOLDER_HREF_RE = /href=["'](?:#offer|#cta|#affiliate|OFFER_URL|AFFILIATE_URL)["']/gi;

const AFFILIATE_BLOCK_RE =
  /<(?:aside|div|table)[^>]*class="(?:sms-affiliate-(?:banner|cta)|affiliate-(?:banner|cta)|sms-comparison)"[\s\S]*?<\/(?:aside|div|table)>/gi;

const DISCLOSURE_RE = /<p[^>]*class="affiliate-disclosure"[\s\S]*?<\/p>/gi;
const PICK_PARAGRAPH_RE = /<p[^>]*class="affiliate-pick"[\s\S]*?<\/p>/gi;

// Matches a tracked-click href so existing inline links can be detected/refreshed.
const TRACKED_HREF_RE = /href=["'][^"']*\/api\/blog\/track-click[^"']*["']/gi;

/**
 * Strip every *block* artifact this module injects (disclosure, end CTA, banner,
 * fallback pick paragraph) so weaving can be re-run safely. A natural inline
 * link the model placed inside the prose is intentionally KEPT — it is the whole
 * point — and only has its href refreshed during re-weave.
 */
export function stripAffiliateBlocks(html: string): string {
  return html
    .replace(AFFILIATE_BLOCK_RE, "")
    .replace(DISCLOSURE_RE, "")
    .replace(PICK_PARAGRAPH_RE, "")
    .trim();
}


export function renderCtaButton(label: string, href: string): string {
  return `<div class="affiliate-cta">
  <a href="${href}" ${REL}>${escapeHtml(label)}</a>
</div>`;
}

/** Natural fallback recommendation paragraph, used only if the model omitted the inline link. */
function recommendationParagraph(link: ArmedLink, href: string): string {
  const label = escapeHtml(link.label?.trim() || "this option");
  return `<p class="affiliate-pick">If you'd rather skip the trial-and-error, <a href="${href}" ${REL}>${label}</a> is the pick we keep coming back to — it covers the essentials we walked through above and is the easiest place to start.</p>`;
}

const RELATED_SECTION_RE = /<section class="sms-related"[\s\S]*$/i;

function splitRelatedSection(html: string): { body: string; related: string } {
  const match = html.match(RELATED_SECTION_RE);
  if (!match || match.index === undefined) {
    return { body: html, related: "" };
  }
  return {
    body: html.slice(0, match.index).trim(),
    related: match[0],
  };
}

function isValidLink(link: ArmedLink): boolean {
  try {
    const url = normalizeAffiliateUrl(link.url);
    return Boolean(url && new URL(url).protocol.startsWith("http"));
  } catch {
    return false;
  }
}

/**
 * Replace model-provided placeholder anchors with the tracked affiliate URL.
 * Returns whether at least one inline link was woven into the prose.
 */
function applyInlinePlaceholders(html: string, tracked: string): { html: string; woven: boolean } {
  let woven = false;
  const out = html.replace(PLACEHOLDER_HREF_RE, () => {
    woven = true;
    return `href="${tracked}" ${REL}`;
  });
  return { html: out, woven };
}

/**
 * Weave the primary affiliate offer into the article:
 *  1. ONE contextual inline link inside the prose (from the model's placeholder,
 *     or a natural fallback paragraph after the first H2),
 *  2. a single end-of-article CTA pointing at the same offer.
 *
 * Site-wide FTC disclosure lives in the footer — not repeated inside each article.
 */
export function weaveAffiliateLinks(
  html: string,
  links: ArmedLink[],
  postId: string,
  siteId: string
): string {
  const cleaned = stripAffiliateBlocks(html);
  if (links.length === 0) return cleaned;

  const primary = links.find((link) => isValidLink(link)) ?? links[0];
  const offerUrl = normalizeAffiliateUrl(primary.url);
  if (!offerUrl) return cleaned;

  const tracked = buildTrackUrl(postId, siteId, offerUrl);
  const { body, related } = splitRelatedSection(cleaned);

  let withInline: string;
  if (body.includes("/api/blog/track-click")) {
    // An inline link already exists (e.g. re-weave on render) — keep it in place,
    // just refresh the href so it always points at the current tracked offer.
    withInline = body.replace(TRACKED_HREF_RE, `href="${tracked}"`);
  } else {
    const { html: inlined, woven } = applyInlinePlaceholders(body, tracked);
    withInline = woven
      ? inlined
      : insertAfterH2(inlined, recommendationParagraph(primary, tracked), 0);
  }

  const cta = renderCtaButton("Check Today's Price", tracked);

  return `${withInline}${cta}${related}`;
}
