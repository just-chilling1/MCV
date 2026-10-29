import type { BlogSite } from "../types";

/** Full niche angle chosen in Empire Builder (not the short hobby label). */
export function getSiteTerritory(
  site: Pick<BlogSite, "territory" | "title" | "tagline" | "hobby">
): string {
  if (site.territory?.trim()) return site.territory.trim();
  if (site.title?.endsWith(" Money Site")) {
    return site.title.replace(/ Money Site$/, "").trim();
  }
  if (site.tagline?.startsWith("Your private cash asset for ")) {
    return site.tagline.replace("Your private cash asset for ", "").trim();
  }
  return site.hobby.trim();
}
