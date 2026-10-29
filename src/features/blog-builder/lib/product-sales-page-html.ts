import type { ThemeConfig } from "../types";
import { resolveThemeConfig, THEME_PRESETS, getReadyTemplateFromConfig } from "../themes";
import type { ProductSalesCopy } from "./product-sales-copy";
import { normalizeAffiliateUrl } from "./affiliate-url";
import { buildSalesPageBody, structureLayoutCss } from "./sales-page-layouts";

export interface ThemedSalesPageInput {
  productName: string;
  niche: string;
  copy: ProductSalesCopy;
  affiliateUrl: string;
  themeConfig?: ThemeConfig | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trackClickHref(siteId: string, affiliateUrl: string): string {
  const url = normalizeAffiliateUrl(affiliateUrl);
  return `/api/blog/track-click?site=${encodeURIComponent(siteId)}&to=${encodeURIComponent(url)}`;
}

function parseHexColor(value: string): { r: number; g: number; b: number } | null {
  const hex = value.trim().replace("#", "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(hex)) return null;
  const normalized =
    hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function relativeLuminance(value: string): number {
  const rgb = parseHexColor(value);
  if (!rgb) return 0.5;
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function brightenHex(value: string, amount = 0.45): string {
  const rgb = parseHexColor(value);
  if (!rgb) return "#fbbf24";
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(rgb.r)}${mix(rgb.g)}${mix(rgb.b)}`;
}

function accentOnBackground(accent: string, background: string): string {
  const accentLum = relativeLuminance(accent);
  const bgLum = relativeLuminance(background);
  const needsBrightAccent = bgLum < 0.25 && accentLum < 0.35;
  const needsDarkAccent = bgLum > 0.7 && accentLum > 0.75;
  if (needsBrightAccent) return brightenHex(accent, 0.55);
  if (needsDarkAccent) return "#0f766e";
  return accent;
}

function heroGradient(from: string, to: string, darkMode: boolean): string {
  if (!darkMode) return `linear-gradient(135deg, ${from}, ${to})`;
  const start = relativeLuminance(from) < 0.35 ? brightenHex(from, 0.5) : from;
  const end = relativeLuminance(to) < 0.35 ? brightenHex(to, 0.45) : to;
  return `linear-gradient(135deg, ${start}, ${end})`;
}

/** Build a full sales page HTML document styled with the user's chosen template. */
export function buildThemedProductSalesPage(
  input: ThemedSalesPageInput & { siteId: string }
): string {
  const template = getReadyTemplateFromConfig(input.themeConfig);
  const { preset, colors, headingFont, bodyFont } = resolveThemeConfig(input.themeConfig);
  const presetDef = THEME_PRESETS[preset.id] ?? THEME_PRESETS.editorial;
  const googleFontsUrl = template.googleFontsUrl ?? presetDef.fonts.googleUrl;
  const ctaHref = trackClickHref(input.siteId, input.affiliateUrl);

  const isDark = template.structureId === "conversion";
  const bg = isDark ? "#0f0f10" : colors.bg;
  const surface = isDark ? "#18181b" : colors.surface;
  const elevated = isDark ? "#ffffff" : "#f4f4f5";
  const text = isDark ? "#f4f4f5" : colors.text;
  const muted = isDark ? "#a1a1aa" : colors.muted;
  const cardText = isDark ? "#1c1917" : colors.text;
  const cardMuted = isDark ? "#57534e" : colors.muted;
  const accent = colors.accent;
  const accentSoft = colors.accentSoft ?? `${accent}1a`;
  const labelColor = accentOnBackground(accent, bg);
  const labelColorAlt = accentOnBackground(accent, surface);
  const gradient = heroGradient(colors.gradientFrom, colors.gradientTo, isDark);
  const border = isDark ? "rgba(255,255,255,0.08)" : colors.border;

  const copy = input.copy;
  const productName = escapeHtml(input.productName);
  const metaDescription = escapeHtml(copy.subhook.slice(0, 155));
  const faqJsonLd = copy.faqs.length
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: copy.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }).replace(/</g, "\\u003c")
    : "";

  const bodyHtml = buildSalesPageBody({
    structureId: template.structureId,
    templateName: template.name,
    productName: input.productName,
    niche: input.niche,
    copy,
    ctaHref,
    escapeHtml,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${productName}</title>
  <meta name="description" content="${metaDescription}">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${productName}">
  <meta property="og:description" content="${metaDescription}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${productName}">
  <meta name="twitter:description" content="${metaDescription}">
  ${faqJsonLd ? `<script type="application/ld+json">${faqJsonLd}</script>` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsUrl}" rel="stylesheet">
  <style>
    .product-sales-page-root {
      --bg: ${bg};
      --surface: ${surface};
      --elevated: ${elevated};
      --text: ${text};
      --muted: ${muted};
      --card-text: ${cardText};
      --card-muted: ${cardMuted};
      --accent: ${accent};
      --accent-soft: ${accentSoft};
      --label: ${labelColor};
      --label-alt: ${labelColorAlt};
      --gradient: ${gradient};
      --heading-font: ${headingFont};
      --body-font: ${bodyFont};
      --border: ${border};
      color: var(--text);
      background: var(--bg);
      min-height: 100vh;
      font-family: var(--body-font);
      line-height: 1.7;
    }
    .product-sales-page-root * { margin: 0; padding: 0; box-sizing: border-box; }
    .product-sales-page-root .container { max-width: 880px; margin: 0 auto; padding: 0 24px; }
    .product-sales-page-root .hero {
      min-height: clamp(420px, 72vh, 760px); display: flex; align-items: center; justify-content: center; text-align: center;
      padding: clamp(48px, 8vw, 80px) 24px;
      background: radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 55%), var(--bg);
      color: var(--text);
    }
    .product-sales-page-root .badge {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
      background: var(--accent-soft); border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
      border-radius: 999px; font-size: 12px; font-weight: 700; color: var(--label);
      text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 28px;
    }
    .product-sales-page-root .hero h1 {
      font-family: var(--heading-font); font-size: clamp(2.2rem, 6vw, 4rem); font-weight: 800;
      line-height: 1.08; margin-bottom: 20px; color: var(--text);
    }
    .product-sales-page-root .hero-accent {
      background: var(--gradient);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }
    .product-sales-page-root .hero-sub { font-size: clamp(1.05rem, 2.5vw, 1.35rem); color: var(--muted); max-width: 640px; margin: 0 auto 40px; }
    .product-sales-page-root .cta {
      display: inline-flex; align-items: center; gap: 12px; padding: 18px 40px;
      background: var(--gradient); border-radius: 14px; font-size: 17px; font-weight: 700;
      color: #fff; text-decoration: none; box-shadow: 0 8px 32px color-mix(in srgb, var(--accent) 35%, transparent);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .product-sales-page-root .cta:hover { transform: translateY(-2px); }
    .product-sales-page-root section {
      padding: clamp(48px, 8vw, 80px) 24px;
      background: var(--bg);
      color: var(--text);
    }
    .product-sales-page-root section.alt {
      background: var(--surface);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .product-sales-page-root section.alt .label { color: var(--label-alt); }
    .product-sales-page-root .label {
      display: inline-block;
      font-size: 11px; font-weight: 800; color: var(--label); text-transform: uppercase;
      letter-spacing: 2px; margin-bottom: 12px;
    }
    .product-sales-page-root .title {
      font-family: var(--heading-font); font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 700;
      margin-bottom: 16px; color: var(--text);
    }
    .product-sales-page-root .split h3 { color: var(--text); }
    .product-sales-page-root .subtitle { font-size: 1.1rem; color: var(--muted); max-width: 620px; margin-bottom: 36px; }
    .product-sales-page-root .center { text-align: center; }
    .product-sales-page-root .center .subtitle { margin-left: auto; margin-right: auto; }
    .product-sales-page-root .problem-list { display: grid; gap: 14px; margin-top: 28px; }
    .product-sales-page-root .problem-item {
      display: flex; gap: 14px; align-items: flex-start; padding: 20px 22px;
      background: var(--elevated); color: var(--card-text); border-radius: 14px; border: 1px solid var(--border);
    }
    .product-sales-page-root .problem-item span:last-child { color: var(--card-text); }
    .product-sales-page-root .problem-item span:first-child { color: var(--label); font-weight: 800; }
    .product-sales-page-root .agitation {
      margin-top: 36px; padding: 28px; border-left: 4px solid var(--label);
      background: var(--accent-soft); border-radius: 0 14px 14px 0; font-style: italic; color: var(--muted);
    }
    .product-sales-page-root .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 32px; }
    .product-sales-page-root .benefits-section { padding-top: 72px; padding-bottom: 72px; }
    .product-sales-page-root .benefits-header { margin-bottom: 36px; }
    .product-sales-page-root .benefits-header .title { margin-bottom: 0; }
    .product-sales-page-root .benefits-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
    }
    @media (min-width: 640px) {
      .product-sales-page-root .benefits-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; }
    }
    @media (min-width: 960px) {
      .product-sales-page-root .benefits-grid.benefits-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; }
    }
    .product-sales-page-root .card-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
    }
    @media (min-width: 640px) {
      .product-sales-page-root .card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    .product-sales-page-root .card {
      padding: 28px; background: var(--elevated); color: var(--card-text); border-radius: 18px;
      border: 1px solid var(--border); transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 1px 2px color-mix(in srgb, var(--card-text) 6%, transparent);
    }
    .product-sales-page-root .card:hover {
      border-color: color-mix(in srgb, var(--accent) 40%, transparent);
      transform: translateY(-2px);
      box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 12%, transparent);
    }
    .product-sales-page-root .benefit-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: 100%;
      min-height: 148px;
    }
    .product-sales-page-root .benefit-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: fit-content;
      min-width: 2rem;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--label);
      background: color-mix(in srgb, var(--accent) 12%, var(--elevated));
      border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
    }
    .product-sales-page-root .card h3 {
      font-family: var(--heading-font); font-size: 1.12rem; line-height: 1.35;
      margin-bottom: 4px; color: var(--card-text); font-weight: 700;
    }
    .product-sales-page-root .card p { color: var(--card-muted); font-size: 0.95rem; line-height: 1.6; margin: 0; }
    .product-sales-page-root .split { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    @media (max-width: 768px) { .product-sales-page-root .split { grid-template-columns: 1fr; } }
    .product-sales-page-root .list { list-style: none; display: grid; gap: 10px; }
    .product-sales-page-root .list li {
      padding: 14px 16px; background: var(--elevated); color: var(--card-text); border-radius: 12px;
      border: 1px solid var(--border); font-size: 0.95rem;
    }
    .product-sales-page-root .contents { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .product-sales-page-root .content-item {
      display: flex; gap: 10px; align-items: center; padding: 16px 18px;
      background: var(--elevated); color: var(--card-text); border-radius: 12px; border: 1px solid var(--border);
    }
    .product-sales-page-root .content-item span:last-child { color: var(--card-text); }
    .product-sales-page-root .faq-list { display: grid; gap: 14px; max-width: 760px; margin: 0 auto; }
    .product-sales-page-root .faq {
      padding: 24px; background: var(--elevated); color: var(--card-text); border-radius: 14px;
      border: 1px solid var(--border);
    }
    .product-sales-page-root .faq-q { font-weight: 700; margin-bottom: 8px; color: var(--card-text); }
    .product-sales-page-root .faq-a { color: var(--card-muted); }
    .product-sales-page-root .guarantee {
      max-width: 640px; margin: 0 auto; padding: 40px; text-align: center;
      background: var(--accent-soft); border: 2px solid color-mix(in srgb, var(--accent) 35%, transparent); border-radius: 20px;
      color: var(--text);
    }
    .product-sales-page-root .guarantee .title,
    .product-sales-page-root .guarantee .subtitle { color: var(--text); }
    .product-sales-page-root .final {
      text-align: center; padding: 100px 24px;
      background: radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 65%), var(--bg);
      color: var(--text);
    }
    .product-sales-page-root .price-box { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 24px 0 32px; }
    .product-sales-page-root .old-price { font-size: 1.5rem; color: var(--muted); text-decoration: line-through; }
    .product-sales-page-root .new-price { font-size: 3rem; font-weight: 900; color: var(--label); }
    .product-sales-page-root .template-tag { font-size: 11px; color: var(--muted); margin-top: 24px; }
    .product-sales-page-root .mobile-cta-bar {
      display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 40;
      padding: 12px 16px max(12px, env(safe-area-inset-bottom));
      background: color-mix(in srgb, var(--bg) 90%, transparent);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-top: 1px solid var(--border);
    }
    .product-sales-page-root .cta-mobile { width: 100%; max-width: 420px; justify-content: center; margin: 0 auto; }
    @media (max-width: 768px) {
      .product-sales-page-root .mobile-cta-bar { display: flex; justify-content: center; }
      .product-sales-page-root { padding-bottom: 88px; }
      .product-sales-page-root .hero { min-height: auto; }
      .product-sales-page-root .final { padding: 64px 20px; }
    }
    .product-sales-page-root footer {
      text-align: center; padding: 32px 24px; color: var(--muted); font-size: 13px;
      border-top: 1px solid var(--border); background: var(--bg);
    }
    .product-sales-page-root .accent-text { color: var(--label); }
    ${structureLayoutCss(template.structureId)}
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

/** Extract styles + body inner HTML for embedding in Next.js layout. */
export function parseSalesPageDocument(html: string): {
  styles: string;
  bodyHtml: string;
  scripts: string[];
  googleFontsUrl?: string;
  metaDescription?: string;
} {
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const fontMatch =
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/i) ??
    html.match(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/i);
  const metaMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);

  const rawBody = bodyMatch?.[1]?.trim() ?? html;
  const scripts: string[] = [];
  const bodyHtml = rawBody
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (_, content: string) => {
      const trimmed = content.trim();
      if (trimmed) scripts.push(trimmed);
      return "";
    })
    .trim();

  return {
    styles: styleMatch?.[1]?.trim() ?? "",
    bodyHtml,
    scripts,
    googleFontsUrl: fontMatch?.[1],
    metaDescription: metaMatch?.[1],
  };
}

export function applyAffiliateLinkToSalesPage(html: string, affiliateUrl: string, siteId: string): string {
  const href = trackClickHref(siteId, affiliateUrl);
  return html
    .replace(/href="#buy"/g, `href="${href}"`)
    .replace(/href="#"/g, `href="${href}"`);
}
