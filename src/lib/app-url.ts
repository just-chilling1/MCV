import { getAppUrl } from "@/lib/brand-vars";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function getOriginFromRequest(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host")?.trim();
    if (!host) return null;

    const protocol =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      url.protocol.replace(":", "");

    return stripTrailingSlash(`${protocol}://${host}`);
  } catch {
    return null;
  }
}

/** Resolve the public app origin on the server — avoids localhost when env is unset on Vercel. */
export function getServerAppUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && !isLocalhostUrl(configured)) {
    return stripTrailingSlash(configured);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${stripTrailingSlash(vercelUrl)}`;
  }

  if (request) {
    const origin = getOriginFromRequest(request);
    if (origin) return origin;
  }

  if (configured) return stripTrailingSlash(configured);
  return stripTrailingSlash(getAppUrl());
}

/** Path a site is served at — member-handle URLs for new sites, /sites/{slug} for legacy ones. */
export function sitePublicPath(site: { slug: string; owner_handle?: string | null }): string {
  return site.owner_handle
    ? `/${site.owner_handle}/sites/${site.slug}`
    : `/sites/${site.slug}`;
}

export function buildOfferPageUrl(
  appUrl: string,
  slug: string,
  ownerHandle?: string | null
): string {
  return `${stripTrailingSlash(appUrl)}${sitePublicPath({ slug, owner_handle: ownerHandle })}`;
}

/** Rewrite stored offer links that used localhost or the wrong host. */
export function resolveOfferPageLinksInText(text: string, offerPageUrl: string, slug: string): string {
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`https?:\\/\\/[^\\s]+\\/sites\\/${escapedSlug}`, "gi"), offerPageUrl);
}
