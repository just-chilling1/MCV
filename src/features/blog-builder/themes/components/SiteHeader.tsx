import { getPublicBrand } from "../public-branding";
import type { HeaderModule, PublicSite } from "../types";

interface SiteHeaderProps {
  site: PublicSite;
  variant: HeaderModule;
}

/** Homepage intro block — sticky nav is separate (SiteNav). */
export function SiteHeader({ site, variant }: SiteHeaderProps) {
  const brand = getPublicBrand(site);

  if (variant === "minimal") {
    return (
      <div className="blog-home-split">
        <p className="blog-chip mb-3">{brand.category}</p>
        <h1>{brand.name}</h1>
        <p className="blog-hero-subtitle mt-3">{brand.tagline}</p>
      </div>
    );
  }

  if (variant === "centered") {
    return (
      <div className="blog-home-centered">
        <p className="blog-chip mb-4">{brand.category}</p>
        <h1>{brand.name}</h1>
        <p>{brand.tagline}</p>
      </div>
    );
  }

  return (
    <div className="blog-home-split">
      <p className="blog-chip mb-3">{brand.category}</p>
      <h1>{brand.name}</h1>
      <p className="blog-hero-subtitle mt-3 max-w-2xl">{brand.tagline}</p>
    </div>
  );
}
