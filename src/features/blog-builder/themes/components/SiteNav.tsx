import Link from "next/link";
import { getPublicBrand } from "../public-branding";
import type { PublicSite } from "../types";

interface SiteNavProps {
  site: PublicSite;
  siteSlug: string;
  backHref?: string;
}

export function SiteNav({ site, siteSlug, backHref }: SiteNavProps) {
  const brand = getPublicBrand(site);
  const homeHref = `/sites/${siteSlug}`;

  return (
    <nav className="blog-nav" aria-label="Site">
      <div className="blog-nav-inner">
        <Link href={homeHref} className="blog-brand">
          {brand.name}
        </Link>
        <div className="flex items-center gap-4">
          {backHref ? (
            <Link href={backHref} className="blog-nav-link">
              ← All guides
            </Link>
          ) : (
            <span className="blog-chip">{brand.category}</span>
          )}
        </div>
      </div>
    </nav>
  );
}
