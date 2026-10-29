import Link from "next/link";
import { getPublicBrand } from "../public-branding";
import { PostThumb } from "./PostThumb";
import type { HeroModule, PublicPostSummary, PublicSite } from "../types";

interface SiteHeroProps {
  variant: HeroModule;
  site: PublicSite;
  siteSlug: string;
  posts: PublicPostSummary[];
}

export function SiteHero({ variant, site, siteSlug, posts }: SiteHeroProps) {
  if (variant === "none") return null;

  const pillar = posts.find((p) => p.is_pillar) ?? posts[0];
  const brand = getPublicBrand(site);

  if (variant === "cta-banner") {
    return (
      <section className="blog-cta-hero">
        <div className="blog-cta-hero-inner">
          <div className="max-w-2xl">
            <span className="blog-chip mb-3">Editor&apos;s pick</span>
            <h2 className="blog-cta-hero-title text-xl sm:text-2xl font-medium leading-snug mt-2">
              Start with our most-read {brand.category.toLowerCase()} guide
            </h2>
            <p className="blog-meta mt-2">
              Research-backed comparisons, budget picks, and mistakes to avoid.
            </p>
          </div>
          {pillar && (
            <Link href={`/sites/${siteSlug}/${pillar.slug}`} className="blog-btn shrink-0">
              Read the main guide →
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (!pillar) return null;

  return (
    <section className="blog-hero">
      <div className="blog-hero-inner">
        <div className="blog-hero-featured">
          <PostThumb
            href={`/sites/${siteSlug}/${pillar.slug}`}
            imageUrl={pillar.image_url}
            alt={pillar.title}
            className="blog-hero-featured-media min-h-[14rem] md:min-h-full"
            large
          />
          <div className="blog-hero-featured-body">
            <span className="blog-chip-gold blog-chip mb-3">Featured guide</span>
            <h2 className="blog-hero-featured-title">
              <Link href={`/sites/${siteSlug}/${pillar.slug}`}>{pillar.title}</Link>
            </h2>
            {pillar.excerpt && (
              <p className="blog-meta mt-3 text-base leading-relaxed line-clamp-4">{pillar.excerpt}</p>
            )}
            <Link href={`/sites/${siteSlug}/${pillar.slug}`} className="blog-btn mt-5 w-fit">
              Read the full guide
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
