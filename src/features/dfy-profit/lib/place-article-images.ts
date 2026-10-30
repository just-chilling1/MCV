import * as cheerio from "cheerio";
import type { ArticleImage } from "@/types";

function imgHtml(image: ArticleImage): string {
  const alt = (image.alt || image.section || "").replace(/"/g, "&quot;");
  return `<figure data-article-image="${image.position}"><img src="${image.url}" alt="${alt}" loading="lazy" /></figure>`;
}

/**
 * Insert header / mid / conclusion images into article HTML as inline figures.
 * Rebuilds the fragment so the header always lands first (cheerio .before on the
 * first root child is unreliable in fragment mode).
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
  const blocks: string[] = [];

  if (byPos.top) blocks.push(imgHtml(byPos.top));

  if (roots.length === 0) {
    if (html.trim()) blocks.push(html.trim());
    if (byPos.middle) blocks.push(imgHtml(byPos.middle));
    if (byPos.bottom) blocks.push(imgHtml(byPos.bottom));
    return blocks.join("\n");
  }

  const midAfterIndex = Math.max(0, Math.floor(roots.length / 2) - 1);
  roots.forEach((el, i) => {
    blocks.push($.html(el) ?? "");
    if (byPos.middle && i === midAfterIndex) blocks.push(imgHtml(byPos.middle));
  });

  if (byPos.bottom) blocks.push(imgHtml(byPos.bottom));

  return blocks.join("\n");
}
