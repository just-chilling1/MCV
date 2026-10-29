import type { SupabaseClient } from "@supabase/supabase-js";
import { generateAndSavePost, backfillMissingPostImages, TEXT_GENERATION_CONCURRENCY } from "./generation-pipeline";
import { SiteImagePool } from "./site-image-pool";
import { buildLargeClusterTopics } from "./templates";
import { weaveAffiliateLinks } from "./affiliate";
import { scrapePage, buildProductContext } from "./scrape";
import { fetchTrendingAngles } from "./trends";
import { mapWithConcurrency } from "./concurrency";
import { slugify } from "./seo";
import { pickThemeForRecurringSite, buildSiteTitle, buildSiteTagline } from "../themes";
import type { ArmedLink, BlogPost, BlogSite } from "../types";

export const TEMPLATE_ARTICLE_COUNT = 25;

export interface RecurringTemplateProduct {
  id: number;
  name: string;
  niche: string;
  productUrl: string;
}

export function templateKeyFor(productId: number): string {
  return `recurring-${productId}`;
}

function newSlug(seed: string): string {
  return `${slugify(seed) || "site"}-${crypto.randomUUID().slice(0, 8)}`;
}

async function loadTemplate(
  admin: SupabaseClient,
  productId: number
): Promise<{ site: BlogSite; posts: BlogPost[] } | null> {
  // limit(1) (not maybeSingle) so a stray duplicate never throws; we reuse the
  // earliest template site and return it even when it's still empty/mid-fill so
  // seeding tops it up instead of creating another one.
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
 * Seed (or top up) the shared template site for a product: a full
 * TEMPLATE_ARTICLE_COUNT-article site with images, owned by TEMPLATE_OWNER_ID,
 * articles left with the inline-offer placeholder so each clone can drop in the
 * member's own link. Idempotent — returns early if already complete.
 */
export async function seedProductTemplate(
  admin: SupabaseClient,
  product: RecurringTemplateProduct
): Promise<{ created: number; skipped: boolean; siteId: string }> {
  const ownerId = process.env.TEMPLATE_OWNER_ID?.trim();
  if (!ownerId) {
    throw new Error("TEMPLATE_OWNER_ID env is not set (must be a real Supabase user id).");
  }

  const existing = await loadTemplate(admin, product.id);
  if (existing && existing.posts.length >= TEMPLATE_ARTICLE_COUNT) {
    return { created: 0, skipped: true, siteId: existing.site.id };
  }

  let site = existing?.site ?? null;
  if (!site) {
    const slug = newSlug(product.niche);
    const { data, error } = await admin
      .from("sites")
      .insert({
        user_id: ownerId,
        hobby: product.niche,
        territory: product.name,
        title: buildSiteTitle(product.niche),
        tagline: buildSiteTagline(product.niche),
        slug,
        theme: pickThemeForRecurringSite(),
        armed_links: [] as ArmedLink[],
        status: "draft",
        is_template: true,
        template_key: templateKeyFor(product.id),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    site = data as BlogSite;
  }

  const [productContext, trendContext] = await Promise.all([
    product.productUrl
      ? scrapePage(product.productUrl).then((s) => (s ? buildProductContext(s) : ""))
      : Promise.resolve(""),
    fetchTrendingAngles(product.name, product.niche),
  ]);

  const topics = buildLargeClusterTopics(product.name, product.niche, TEMPLATE_ARTICLE_COUNT);
  const templateSite = site;
  const imagePool = new SiteImagePool();

  const results = await mapWithConcurrency(topics, TEXT_GENERATION_CONCURRENCY, async (topic, index) => {
    try {
      await generateAndSavePost({
        supabase: admin,
        userId: ownerId,
        site: templateSite,
        topic,
        productContext,
        trendContext,
        fastImage: true,
        imagePool,
        postIndex: index,
      });
      return true;
    } catch {
      return false;
    }
  });

  return { created: results.filter(Boolean).length, skipped: false, siteId: templateSite.id };
}

function createUserSiteRow(
  admin: SupabaseClient,
  userId: string,
  product: RecurringTemplateProduct,
  affiliateUrl: string
) {
  const slug = newSlug(product.niche);
  const armedLinks: ArmedLink[] = [
    { label: product.name.slice(0, 80), url: affiliateUrl, network: "digistore" },
  ];
  return admin
    .from("sites")
    .insert({
      user_id: userId,
      hobby: product.niche,
      territory: product.name,
      title: buildSiteTitle(product.niche),
      tagline: buildSiteTagline(product.niche),
      slug,
      theme: pickThemeForRecurringSite(),
      armed_links: armedLinks,
      status: "live",
      is_template: false,
      // Stamps the originating product so the Asset Vault can tag this as a
      // Premium (Society Access) site vs a normal generated one.
      template_key: templateKeyFor(product.id),
    })
    .select()
    .single();
}

async function cloneTemplate(
  admin: SupabaseClient,
  template: { site: BlogSite; posts: BlogPost[] },
  userId: string,
  product: RecurringTemplateProduct,
  affiliateUrl: string
): Promise<BlogSite> {
  const { data: siteData, error: siteErr } = await createUserSiteRow(admin, userId, product, affiliateUrl);
  if (siteErr || !siteData) throw new Error(siteErr?.message ?? "Failed to create site");
  const site = siteData as BlogSite;

  const armed: ArmedLink[] = [{ label: product.name, url: affiliateUrl, network: "digistore" }];
  const now = new Date().toISOString();

  const rows = template.posts.map((post) => {
    const postId = crypto.randomUUID();
    let html = (post.html ?? "")
      .split(`/sites/${template.site.slug}/`)
      .join(`/sites/${site.slug}/`);
    html = weaveAffiliateLinks(html, armed, postId, site.id);
    return {
      id: postId,
      site_id: site.id,
      user_id: userId,
      title: post.title,
      slug: post.slug,
      html,
      excerpt: post.excerpt,
      meta_description: post.meta_description,
      image_url: post.image_url,
      image_alt: post.image_alt,
      is_pillar: post.is_pillar,
      status: "live" as const,
      publish_at: now,
    };
  });

  const { error: postErr } = await admin.from("posts").insert(rows);
  if (postErr) throw new Error(postErr.message);

  return site;
}

async function generateFreshSite(
  admin: SupabaseClient,
  userId: string,
  product: RecurringTemplateProduct,
  affiliateUrl: string
): Promise<BlogSite> {
  const { data: siteData, error: siteErr } = await createUserSiteRow(admin, userId, product, affiliateUrl);
  if (siteErr || !siteData) throw new Error(siteErr?.message ?? "Failed to create site");
  const site = siteData as BlogSite;

  const [productContext, trendContext] = await Promise.all([
    product.productUrl
      ? scrapePage(product.productUrl).then((s) => (s ? buildProductContext(s) : ""))
      : Promise.resolve(""),
    fetchTrendingAngles(product.name, product.niche),
  ]);

  const topics = buildLargeClusterTopics(product.name, product.niche, TEMPLATE_ARTICLE_COUNT);

  await mapWithConcurrency(topics, TEXT_GENERATION_CONCURRENCY, async (topic) => {
    try {
      await generateAndSavePost({
        supabase: admin,
        userId,
        site,
        topic,
        productContext,
        trendContext,
        skipImage: true,
      });
    } catch {
      /* per-post failure tolerated */
    }
  });

  await admin
    .from("posts")
    .update({ status: "live", publish_at: new Date().toISOString() })
    .eq("site_id", site.id)
    .eq("user_id", userId);

  // Attach hero images in the background so the response returns quickly.
  void backfillMissingPostImages(admin, userId, site.id);

  return site;
}

/**
 * "Get Website": clone the product's pre-seeded template into the member's
 * vault with their affiliate link. Falls back to generating a fresh site on the
 * fly if the template hasn't been seeded yet.
 */
export async function getWebsiteForUser(params: {
  admin: SupabaseClient;
  userId: string;
  product: RecurringTemplateProduct;
  affiliateUrl: string;
}): Promise<{ site: BlogSite; mode: "cloned" | "generated" }> {
  const { admin, userId, product, affiliateUrl } = params;

  const template = await loadTemplate(admin, product.id);
  if (template && template.posts.length > 0) {
    const site = await cloneTemplate(admin, template, userId, product, affiliateUrl);
    return { site, mode: "cloned" };
  }

  const site = await generateFreshSite(admin, userId, product, affiliateUrl);
  return { site, mode: "generated" };
}
