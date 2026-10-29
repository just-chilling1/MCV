import type { HomeListModule, PublicPostSummary } from "../types";
import { PostCard } from "./PostCard";

interface PostListProps {
  posts: PublicPostSummary[];
  siteSlug: string;
  variant: HomeListModule;
  excludeSlug?: string;
}

/**
 * Content-sized magazine layout: a featured card on the left whose height follows
 * its own content, a stacked side column of up to two cards, then a responsive
 * grid for the rest. Cards never stretch to fill empty space.
 */
function FeatureLayout({
  list,
  siteSlug,
  withHead,
}: {
  list: PublicPostSummary[];
  siteSlug: string;
  withHead?: boolean;
}) {
  const [featuredPost, ...others] = list;
  const side = others.slice(0, 2);
  const rest = others.slice(2);

  return (
    <section className="blog-section">
      {withHead && (
        <div className="blog-section-head">
          <h2 className="blog-section-title">Latest guides</h2>
          <span className="blog-meta">{list.length} articles</span>
        </div>
      )}
      <div className="blog-feature-row">
        {featuredPost && (
          <PostCard post={featuredPost} siteSlug={siteSlug} layout="bento" featured />
        )}
        {side.length > 0 && (
          <div className="blog-feature-side">
            {side.map((post) => (
              <PostCard key={post.slug} post={post} siteSlug={siteSlug} layout="bento" />
            ))}
          </div>
        )}
      </div>
      {rest.length > 0 && (
        <div className="blog-bento blog-feature-rest">
          {rest.map((post) => (
            <PostCard key={post.slug} post={post} siteSlug={siteSlug} layout="bento" />
          ))}
        </div>
      )}
    </section>
  );
}

export function PostList({ posts, siteSlug, variant, excludeSlug }: PostListProps) {
  const list = excludeSlug ? posts.filter((p) => p.slug !== excludeSlug) : posts;
  if (list.length === 0) return null;

  if (variant === "bento") {
    return <FeatureLayout list={list} siteSlug={siteSlug} withHead />;
  }

  if (variant === "horizontal") {
    return (
      <section className="blog-section">
        <div className="blog-section-head">
          <h2 className="blog-section-title">All guides</h2>
          <span className="blog-meta">{list.length} articles</span>
        </div>
        <div className="blog-stack">
          {list.map((post) => (
            <PostCard key={post.slug} post={post} siteSlug={siteSlug} layout="horizontal" />
          ))}
        </div>
      </section>
    );
  }

  if (variant === "grid-2") {
    return (
      <section className="blog-section">
        <div className="blog-section-head">
          <h2 className="blog-section-title">Browse guides</h2>
          <span className="blog-meta">{list.length} articles</span>
        </div>
        <div className="blog-grid-3">
          {list.map((post) => (
            <PostCard key={post.slug} post={post} siteSlug={siteSlug} layout="grid" />
          ))}
        </div>
      </section>
    );
  }

  if (variant === "magazine-mix") {
    return <FeatureLayout list={list} siteSlug={siteSlug} />;
  }

  return (
    <section className="blog-section">
      <div className="blog-section-head">
        <h2 className="blog-section-title">Articles</h2>
      </div>
      <div className="blog-stack max-w-3xl">
        {list.map((post) => (
          <PostCard key={post.slug} post={post} siteSlug={siteSlug} layout="stack" />
        ))}
      </div>
    </section>
  );
}
