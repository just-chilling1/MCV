import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser, getServiceRoleClient } from "@/lib/api-auth";
import { buildClusterTopics } from "@/features/blog-builder/lib/templates";
import { getSiteTerritory } from "@/features/blog-builder/lib/site-territory";
import { scrapePageWithCache } from "@/features/blog-builder/lib/scrape-cache";
import { fetchTrendingAngles } from "@/features/blog-builder/lib/trends";
import { mapWithConcurrency } from "@/features/blog-builder/lib/concurrency";
import {
  generateAndSavePost,
  TEXT_GENERATION_CONCURRENCY,
} from "@/features/blog-builder/lib/generation-pipeline";
import { SiteImagePool } from "@/features/blog-builder/lib/site-image-pool";
import type { ArmedLink, BlogSite } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const siteId = typeof body.siteId === "string" ? body.siteId : "";

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .single();

  if (siteError || !site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const typedSite = site as BlogSite;
  const armedLinks = (typedSite.armed_links ?? []) as ArmedLink[];
  const territory = getSiteTerritory(typedSite);
  const topics = buildClusterTopics(territory, typedSite.hobby);

  // Real product details from the offer page + niche trend angles, both fetched
  // once and reused across the whole cluster.
  const affiliateUrl = armedLinks[0]?.url ?? "";
  const admin = getServiceRoleClient();
  const [productContext, trendContext] = await Promise.all([
    affiliateUrl
      ? scrapePageWithCache(affiliateUrl, admin).then((r) => r.context)
      : Promise.resolve(""),
    fetchTrendingAngles(territory, typedSite.hobby),
  ]);

  // Generate the cluster in a bounded concurrency pool via the shared pipeline.
  const imagePool = new SiteImagePool();
  const settled = await mapWithConcurrency(
    topics,
    TEXT_GENERATION_CONCURRENCY,
    async (topic, index) => {
      try {
        const { post } = await generateAndSavePost({
          supabase,
          userId: user.id,
          site: typedSite,
          topic,
          productContext,
          trendContext,
          fastImage: true,
          imagePool,
          postIndex: index,
        });
        return { post };
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Generation failed" };
      }
    }
  );

  const firstError = settled.find((r) => "error" in r && r.error);
  if (firstError && "error" in firstError) {
    return NextResponse.json({ error: firstError.error }, { status: 500 });
  }

  const createdPosts = settled
    .filter((r) => "post" in r && Boolean((r as { post?: unknown }).post))
    .map((r) => (r as { post: unknown }).post);

  return NextResponse.json({ posts: createdPosts, count: createdPosts.length });
}
