import Link from "next/link";
import { PostThumb } from "./PostThumb";
import type { PublicPostSummary } from "../types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface PostCardProps {
  post: PublicPostSummary;
  siteSlug: string;
  layout: "stack" | "grid" | "magazine" | "horizontal" | "bento";
  featured?: boolean;
}

export function PostCard({ post, siteSlug, layout, featured }: PostCardProps) {
  const href = `/sites/${siteSlug}/${post.slug}`;

  if (layout === "bento") {
    return (
      <article className={`blog-bento-item blog-card flex flex-col ${featured ? "blog-bento-featured" : ""}`}>
        <PostThumb href={href} imageUrl={post.image_url} alt={post.title} />
        <div className="blog-card-body">
          {post.is_pillar && <span className="blog-chip-gold blog-chip mb-2">Main guide</span>}
          <h2 className="blog-card-title">
            <Link href={href}>{post.title}</Link>
          </h2>
          {post.excerpt && <p className="blog-meta line-clamp-3">{post.excerpt}</p>}
          <p className="blog-meta pt-2">{formatDate(post.created_at)}</p>
        </div>
      </article>
    );
  }

  if (layout === "horizontal") {
    return (
      <article className="blog-card blog-card-horizontal">
        <PostThumb href={href} imageUrl={post.image_url} alt={post.title} />
        <div className="blog-card-body">
          <div className="flex flex-wrap items-center gap-2">
            {post.is_pillar && <span className="blog-chip-gold blog-chip">Main guide</span>}
            <span className="blog-meta">{formatDate(post.created_at)}</span>
          </div>
          <h2 className="blog-card-title text-lg sm:text-xl">
            <Link href={href}>{post.title}</Link>
          </h2>
          {post.excerpt && <p className="blog-meta line-clamp-2">{post.excerpt}</p>}
          <Link href={href} className="blog-link text-sm mt-1 w-fit">
            Read article →
          </Link>
        </div>
      </article>
    );
  }

  if (layout === "magazine" && featured) {
    return (
      <article className="blog-card overflow-hidden md:col-span-2 grid md:grid-cols-2">
        <PostThumb href={href} imageUrl={post.image_url} alt={post.title} className="min-h-[14rem] md:min-h-full" />
        <div className="blog-card-body">
          {post.is_pillar && <span className="blog-chip-gold blog-chip mb-2">Main guide</span>}
          <h2 className="blog-card-title text-xl sm:text-2xl">
            <Link href={href}>{post.title}</Link>
          </h2>
          {post.excerpt && <p className="blog-meta line-clamp-4">{post.excerpt}</p>}
        </div>
      </article>
    );
  }

  if (layout === "grid") {
    return (
      <article className="blog-card overflow-hidden flex flex-col h-full">
        <PostThumb href={href} imageUrl={post.image_url} alt={post.title} />
        <div className="blog-card-body flex-1">
          {post.is_pillar && <span className="blog-chip-gold blog-chip mb-2">Main guide</span>}
          <h2 className="blog-card-title flex-1">
            <Link href={href}>{post.title}</Link>
          </h2>
          {post.excerpt && <p className="blog-meta line-clamp-2">{post.excerpt}</p>}
          <p className="blog-meta mt-2">{formatDate(post.created_at)}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="blog-card blog-card-horizontal blog-card-stack">
      <PostThumb href={href} imageUrl={post.image_url} alt={post.title} className="blog-stack-thumb" />
      <div className="blog-card-body">
        {post.is_pillar && <span className="blog-chip-gold blog-chip mb-2">Main guide</span>}
        <h2 className="blog-card-title text-lg">
          <Link href={href}>{post.title}</Link>
        </h2>
        {post.excerpt && <p className="blog-meta line-clamp-2">{post.excerpt}</p>}
        <div className="flex items-center justify-between mt-2">
          <span className="blog-meta">{formatDate(post.created_at)}</span>
          <Link href={href} className="blog-link text-sm">
            Read →
          </Link>
        </div>
      </div>
    </article>
  );
}
