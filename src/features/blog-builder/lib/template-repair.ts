import type { SupabaseClient } from "@supabase/supabase-js";
import { buildLargeClusterTopics } from "./templates";
import { scrapePage, buildProductContext } from "./scrape";
import { fetchTrendingAngles } from "./trends";
import { getSiteTerritory } from "./site-territory";
import { regenerateAndSavePost } from "./generation-pipeline";
import { SiteImagePool } from "./site-image-pool";
import { isDefectiveGeneratedPost } from "./template-quality";
import { templateKeyFor, type RecurringTemplateProduct, TEMPLATE_ARTICLE_COUNT } from "./recurring-templates";
import type { BlogPost, BlogSite, ClusterTopic } from "../types";

function topicForPost(post: BlogPost, topics: ClusterTopic[]): ClusterTopic {
  const match = topics.find((t) => t.slug === post.slug);
  if (match) return match;
  return {
    title: post.title,
    slug: post.slug,
    isPillar: post.is_pillar,
    angle: post.is_pillar ? "pillar-guide" : "best-picks",
  };
}

async function loadTemplateSite(
  admin: SupabaseClient,
  productId: number
): Promise<{ site: BlogSite; posts: BlogPost[] } | null> {
  const { data: sites } = await admin
    .from("sites")
    .select("*")
    .eq("is_template", true)
    .eq("template_key", templateKeyFor(productId))
    .order("created_at", { ascending: true })
    .limit(1);

  const site = (sites ?? [])[0] as BlogSite | undefined;
  if (!site) return null;

  const { data: posts } = await admin
    .from("posts")
    .select("*")
    .eq("site_id", site.id)
    .order("is_pillar", { ascending: false })
    .order("created_at", { ascending: true });

  return { site, posts: (posts ?? []) as BlogPost[] };
}

/**
 * Find defective template posts and regenerate them in place (same slug/pillar flag).
 */
export async function repairTemplateProduct(
  admin: SupabaseClient,
  product: RecurringTemplateProduct,
  limit = 2
): Promise<{ repaired: number; failed: number; remaining: number }> {
  const ownerId = process.env.TEMPLATE_OWNER_ID?.trim();
  if (!ownerId) {
    throw new Error("TEMPLATE_OWNER_ID env is not set");
  }

  const loaded = await loadTemplateSite(admin, product.id);
  if (!loaded) {
    throw new Error(`No template site for product ${product.id}`);
  }

  const { site, posts } = loaded;
  const territory = getSiteTerritory(site);
  const topics = buildLargeClusterTopics(product.name, product.niche, TEMPLATE_ARTICLE_COUNT);

  const defective = posts.filter((p) => isDefectiveGeneratedPost(p, territory)).slice(0, Math.max(1, limit));
  if (defective.length === 0) {
    return { repaired: 0, failed: 0, remaining: 0 };
  }

  const [productContext, trendContext] = await Promise.all([
    product.productUrl
      ? scrapePage(product.productUrl).then((s) => (s ? buildProductContext(s) : ""))
      : Promise.resolve(""),
    fetchTrendingAngles(product.name, product.niche),
  ]);

  let repaired = 0;
  let failed = 0;
  const imagePool = new SiteImagePool();

  for (const post of defective) {
    const topic = topicForPost(post, topics);
    const postIndex = topics.findIndex((t) => t.slug === topic.slug);
    try {
      await regenerateAndSavePost({
        supabase: admin,
        userId: ownerId,
        site,
        topic,
        productContext,
        trendContext,
        fastImage: true,
        imagePool,
        postIndex: postIndex >= 0 ? postIndex : 0,
      });
      repaired += 1;
    } catch (err) {
      console.error(`[template-repair] product ${product.id} slug ${post.slug}`, err);
      failed += 1;
    }
  }

  const { data: after } = await admin.from("posts").select("id, title, excerpt, html").eq("site_id", site.id);
  const remaining = (after ?? []).filter((p) =>
    isDefectiveGeneratedPost(p as BlogPost, territory)
  ).length;

  return { repaired, failed, remaining };
}
