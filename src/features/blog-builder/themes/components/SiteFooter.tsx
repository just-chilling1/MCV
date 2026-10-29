import Link from "next/link";
import { getPublicBrand } from "../public-branding";
import type { FooterModule, PublicPostSummary, PublicSite } from "../types";

interface SiteFooterProps {
  site: PublicSite;
  siteSlug: string;
  variant: FooterModule;
  relatedPosts?: PublicPostSummary[];
  currentSlug?: string;
}

export function SiteFooter({
  site,
  siteSlug,
  variant,
  relatedPosts = [],
  currentSlug,
}: SiteFooterProps) {
  const brand = getPublicBrand(site);
  const homeHref = `/sites/${siteSlug}`;
  const related = relatedPosts.filter((p) => p.slug !== currentSlug).slice(0, 4);

  if (variant === "rich") {
    return (
      <footer className="blog-footer mt-auto">
        <div className="blog-footer-inner grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <p className="font-medium text-lg">{brand.name}</p>
            <p className="mt-2 text-sm leading-relaxed blog-meta">{brand.tagline}</p>
            <p className="blog-disclosure">
              We may earn a commission when you buy through links on this site. This helps support
              our research at no extra cost to you. We only recommend products we believe offer
              genuine value.
            </p>
          </div>
          {related.length > 0 && (
            <div>
              <p className="blog-section-title mb-3">More guides</p>
              <ul className="space-y-2">
                {related.map((post) => (
                  <li key={post.slug}>
                    <Link href={`/sites/${siteSlug}/${post.slug}`} className="blog-link text-sm font-normal">
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="blog-section-title mb-3">Explore</p>
            <Link href={homeHref} className="blog-link text-sm font-normal">
              All {brand.category} articles
            </Link>
          </div>
        </div>
        <div className="border-t py-5 text-center text-xs blog-meta" style={{ borderColor: "var(--blog-border)" }}>
          © {new Date().getFullYear()} {brand.name}. Independent editorial content.
        </div>
      </footer>
    );
  }

  return (
    <footer className="blog-footer mt-auto">
      <div className="blog-footer-inner text-center">
        <p className="blog-disclosure text-left">
          We may earn a commission from qualifying purchases. Recommendations are based on independent
          research.
        </p>
        <Link href={homeHref} className="blog-link font-normal text-sm mt-4 inline-block">
          More {brand.category} guides
        </Link>
        <p className="mt-3 text-xs blog-meta">© {new Date().getFullYear()} {brand.name}</p>
      </div>
    </footer>
  );
}
