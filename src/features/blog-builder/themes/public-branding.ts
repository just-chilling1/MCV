import type { PublicSite } from "./types";

export interface PublicBrand {
  name: string;
  tagline: string;
  category: string;
}

const HOBBY_BRANDS: Record<string, string> = {
  chess: "Chess Set Guide",
  golf: "Golf Gear Lab",
  coffee: "Coffee Brew Guide",
  hiking: "Trail Gear Guide",
  fishing: "Angler's Guide",
  cooking: "Kitchen Gear Guide",
  photography: "Lens & Gear Guide",
  fitness: "Fit Gear Guide",
  gardening: "Garden Guide",
  knitting: "Knit & Craft Guide",
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isLegacyTagline(tagline: string | null | undefined): boolean {
  if (!tagline) return true;
  const lower = tagline.toLowerCase();
  return lower.includes("private cash asset") || lower.includes("money site");
}

function isLegacyTitle(title: string): boolean {
  return title.toLowerCase().includes("money site") || title.length > 48;
}

/** Visitor-facing brand — strips internal SMS builder naming. */
export function getPublicBrand(site: Pick<PublicSite, "title" | "tagline" | "hobby" | "territory">): PublicBrand {
  const hobbyKey = site.hobby?.trim().toLowerCase() ?? "";
  const category = site.hobby ? titleCase(site.hobby) : "Guides";

  const name = isLegacyTitle(site.title)
    ? HOBBY_BRANDS[hobbyKey] ?? `${category} Guide`
    : site.title.replace(/\s*Money Site$/i, "").trim();

  const tagline = isLegacyTagline(site.tagline)
    ? `Independent reviews and expert buying advice for ${category.toLowerCase()} enthusiasts`
    : site.tagline!;

  return { name, tagline, category };
}

export function buildSiteTitle(hobby: string): string {
  const key = hobby.trim().toLowerCase();
  return HOBBY_BRANDS[key] ?? `${titleCase(hobby)} Guide`;
}

export function buildSiteTagline(hobby: string): string {
  const category = titleCase(hobby);
  return `Independent reviews and expert buying advice for ${category.toLowerCase()} enthusiasts`;
}
