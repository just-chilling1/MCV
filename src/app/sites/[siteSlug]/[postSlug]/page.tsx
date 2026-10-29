import type { Metadata } from "next";
import { createPublicSupabaseClient } from "@/lib/supabase-public";
import { buildArticleJsonLd } from "@/features/blog-builder/lib/seo";
import { findLiveSiteBySlug } from "@/features/blog-builder/lib/public-site-lookup";
import { SitePostView } from "@/features/blog-builder/themes";
import { getAppUrl } from "@/lib/brand-vars";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ siteSlug: string; postSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteSlug, postSlug } = await params;
  const supabase = createPublicSupabaseClient();

  const site = await findLiveSiteBySlug<{ id: string; slug: string }>(
    supabase,
    "id, slug",
    siteSlug
  );

  if (!site) return { title: "Not found" };

  const { data: post } = await supabase
    .from("live_posts")
    .select("title, meta_description, excerpt, image_url")
    .eq("site_id", site.id)
    .eq("slug", postSlug)
    .maybeSingle();

  if (!post) return { title: "Not found" };

  const base = process.env.NEXT_PUBLIC_APP_URL || getAppUrl();
  const url = `${base}/sites/${siteSlug}/${postSlug}`;

  return {
    title: post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.meta_description ?? post.excerpt ?? undefined,
      url,
      images: post.image_url ? [{ url: post.image_url }] : undefined,
      type: "article",
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { siteSlug, postSlug } = await params;
  const supabase = createPublicSupabaseClient();

  const site = await findLiveSiteBySlug<{
    id: string;
    title: string;
    slug: string;
    hobby: string;
    territory: string | null;
    tagline: string | null;
    theme: string;
    theme_config: import("@/features/blog-builder/types").ThemeConfig | null;
    armed_links: import("@/features/blog-builder/types").ArmedLink[] | undefined;
    template_key: string | null;
  }>(
    supabase,
    "id, title, slug, hobby, territory, tagline, theme, theme_config, armed_links, template_key",
    siteSlug
  );

  if (!site) notFound();

  const { data: post } = await supabase
    .from("live_posts")
    .select("*")
    .eq("site_id", site.id)
    .eq("slug", postSlug)
    .maybeSingle();

  if (!post) notFound();

  const { data: relatedPosts } = await supabase
    .from("live_posts")
    .select("title, slug, excerpt, is_pillar, created_at, image_url")
    .eq("site_id", site.id)
    .order("is_pillar", { ascending: false })
    .limit(8);

  await supabase.rpc("increment_post_views", { post_id: post.id });

  const base = process.env.NEXT_PUBLIC_APP_URL || getAppUrl();
  const url = `${base}/sites/${siteSlug}/${postSlug}`;
  const jsonLd = buildArticleJsonLd({
    title: post.title,
    description: post.meta_description ?? post.excerpt ?? post.title,
    url,
    imageUrl: post.image_url,
    datePublished: post.publish_at ?? post.created_at,
    dateModified: post.created_at,
  });

  return (
    <SitePostView
      site={site}
      siteSlug={siteSlug}
      post={post}
      relatedPosts={relatedPosts ?? []}
      jsonLd={jsonLd}
    />
  );
}
