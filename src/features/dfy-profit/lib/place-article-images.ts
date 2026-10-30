import * as cheerio from "cheerio";
import type { ArticleImage } from "@/types";

function imgHtml(image: ArticleImage): string {
  const alt = (image.alt || image.section || "").replace(/"/g, "&quot;");
  return `<figure data-article-image="${image.position}"><img src="${image.url}" alt="${alt}" loading="lazy" /></figure>`;
}

/**
 * Insert header / mid / conclusion images into authority article HTML.
 * Header at the start, mid after the middle top-level block, conclusion at the end.
 */
export function placeArticleImages(html: string, images: ArticleImage[]): string {
  const byPos = {
    top: images.find((i) => i.position === "top"),
    middle: images.find((i) => i.position === "middle"),
    bottom: images.find((i) => i.position === "bottom"),
  };

  if (!byPos.top && !byPos.middle && !byPos.bottom) return html;

  const $ = cheerio.load(html, { xml: false }, false);
  $("figure[data-article-image]").remove();

  const roots = $.root().children().toArray();
  if (roots.length === 0) {
    const parts: string[] = [];
    if (byPos.top) parts.push(imgHtml(byPos.top));
    if (html.trim()) parts.push(html.trim());
    if (byPos.middle) parts.push(imgHtml(byPos.middle));
    if (byPos.bottom) parts.push(imgHtml(byPos.bottom));
    return parts.join("\n");
  }

  if (byPos.top) {
    $(roots[0]).before(imgHtml(byPos.top));
  }

  if (byPos.middle) {
    const midIndex = Math.floor(roots.length / 2);
    const anchor = roots[Math.max(0, midIndex - 1)] ?? roots[0];
    $(anchor).after(imgHtml(byPos.middle));
  }

  if (byPos.bottom) {
    const last = $.root().children().last();
    if (last.length) last.after(imgHtml(byPos.bottom));
    else $.root().append(imgHtml(byPos.bottom));
  }

  return $.root().html()?.trim() ?? html;
}
