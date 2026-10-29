import Link from "next/link";
import { prepareArticleHtml } from "@/features/blog-builder/lib/article-html";
import { getPublicBrand } from "../public-branding";
import { PostThumb } from "./PostThumb";
import type { PostLayoutModule, PublicPost, PublicPostSummary, PublicSite } from "../types";

interface ArticleLayoutProps {
  site: PublicSite;
  siteSlug: string;
  post: PublicPost;
  layout: PostLayoutModule;
  relatedPosts: PublicPostSummary[];
}

function ArticleBody({ post, site }: { post: PublicPost; site: PublicSite }) {
  const html = prepareArticleHtml({
    html: post.html,
    image_url: post.image_url,
    image_alt: post.image_alt,
    title: post.title,
    id: post.id,
    armedLinks: site.armed_links,
    siteId: site.id,
  });
  return <div className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

function RelatedSidebar({
  posts,
  siteSlug,
  currentSlug,
}: {
  posts: PublicPostSummary[];
  siteSlug: string;
  currentSlug: string;
}) {
  const related = posts.filter((p) => p.slug !== currentSlug).slice(0, 5);
  if (related.length === 0) return null;

  return (
    <aside className="lg:col-span-1">
      <div className="blog-sidebar-card">
        <p className="blog-section-title mb-4">Related guides</p>
        <ul className="space-y-4">
          {related.map((p) => (
            <li key={p.slug}>
              <Link href={`/sites/${siteSlug}/${p.slug}`} className="text-sm font-medium leading-snug hover:text-[var(--blog-accent)]">
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function ArticleLayout({ site, siteSlug, post, layout, relatedPosts }: ArticleLayoutProps) {
  const brand = getPublicBrand(site);
  const published = post.publish_at ?? post.created_at;
  const dateLabel = new Date(published).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hero = (
    <header className="blog-article-hero">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="blog-chip">{brand.category}</span>
        {post.is_pillar && <span className="blog-chip-gold blog-chip">Main guide</span>}
      </div>
      <h1 className="blog-article-title">{post.title}</h1>
      <p className="blog-meta">Updated {dateLabel}</p>
      <figure className="blog-article-featured">
        <PostThumb
          imageUrl={post.image_url}
          alt={post.image_alt ?? post.title}
          className="min-h-[14rem] sm:min-h-[18rem]"
          large
        />
      </figure>
    </header>
  );

  if (layout === "sidebar") {
    return (
      <div className="blog-article-wrap">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 min-w-0">
            {hero}
            <ArticleBody post={post} site={site} />
          </div>
          <RelatedSidebar posts={relatedPosts} siteSlug={siteSlug} currentSlug={post.slug} />
        </div>
      </div>
    );
  }

  const widthClass = layout === "wide" ? "blog-article-wide" : "blog-article-narrow";

  return (
    <div className="blog-article-wrap">
      <article className={`${widthClass} min-w-0`}>
        {hero}
        <ArticleBody post={post} site={site} />
      </article>
    </div>
  );
}
