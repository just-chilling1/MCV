import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import {
  generateAndSavePost,
  loadOwnedSite,
  POST_GENERATION_ATTEMPTS,
  TEXT_GENERATION_CONCURRENCY,
} from "@/features/blog-builder/lib/generation-pipeline";
import { buildClusterTopics } from "@/features/blog-builder/lib/templates";
import { getSiteTerritory } from "@/features/blog-builder/lib/site-territory";
import { mapWithConcurrency } from "@/features/blog-builder/lib/concurrency";
import { fetchTrendingAngles } from "@/features/blog-builder/lib/trends";
import type { ClusterTopic } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Generate deploy posts in parallel on the server (text only — images prefetched separately). */
export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const siteId = typeof body.siteId === "string" ? body.siteId : "";
  const productContext = typeof body.productContext === "string" ? body.productContext : "";
  const clientTrendContext = typeof body.trendContext === "string" ? body.trendContext : "";
  const startIndex = typeof body.startIndex === "number" ? Math.max(0, body.startIndex) : 0;
  const limit =
    typeof body.limit === "number" ? Math.max(1, Math.min(body.limit, 7)) : undefined;

  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400 });
  }

  const site = await loadOwnedSite(supabase, user.id, siteId);
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const territory = getSiteTerritory(site);
  const topics = buildClusterTopics(territory, site.hobby);
  const pendingAll = topics.slice(startIndex);
  const pending = limit ? pendingAll.slice(0, limit) : pendingAll;

  if (pending.length === 0) {
    return NextResponse.json({ results: [], posts: [], failures: [], completedCount: 0, totalCount: 0 });
  }

  const trendContext =
    clientTrendContext ||
    (await fetchTrendingAngles(territory, site.hobby));

  const results = await mapWithConcurrency(
    pending,
    TEXT_GENERATION_CONCURRENCY,
    async (
      topic,
      offset
    ): Promise<{ index: number; topic: ClusterTopic; post?: unknown; error?: string }> => {
      const index = startIndex + offset;
      let lastError = "Generation failed";

      for (let attempt = 0; attempt < POST_GENERATION_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }

        try {
          const result = await generateAndSavePost({
            supabase,
            userId: user.id,
            site,
            topic,
            productContext,
            trendContext,
            contentTier: "deploy",
            skipImage: true,
          });
          return { index, topic, post: result.post };
        } catch (err) {
          lastError = err instanceof Error ? err.message : "Generation failed";
        }
      }

      return { index, topic, error: lastError };
    }
  );

  const failures = results.filter((r) => r.error);
  const posts = results.filter((r) => r.post).map((r) => r.post);

  return NextResponse.json({
    results,
    posts,
    failures: failures.map((f) => ({ index: f.index, slug: f.topic.slug, error: f.error })),
    completedCount: posts.length,
    totalCount: pending.length,
    concurrency: TEXT_GENERATION_CONCURRENCY,
  });
}
