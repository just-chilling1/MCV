import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import {
  generateAndSavePost,
  loadOwnedSite,
  POST_GENERATION_ATTEMPTS,
} from "@/features/blog-builder/lib/generation-pipeline";
import type { ArticleAngle, ClusterTopic, ContentTier } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function parseTopic(raw: unknown): ClusterTopic | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  if (typeof t.title !== "string" || typeof t.slug !== "string") return null;
  const angle = typeof t.angle === "string" ? (t.angle as ArticleAngle) : undefined;
  return { title: t.title, slug: t.slug, isPillar: Boolean(t.isPillar), angle };
}

/** Generate one post (text + optional deferred image). Used for sequential deploy. */
export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const siteId = typeof body.siteId === "string" ? body.siteId : "";
  const topic = parseTopic(body.topic);
  const productContext = typeof body.productContext === "string" ? body.productContext : "";
  const trendContext = typeof body.trendContext === "string" ? body.trendContext : "";
  const contentTier: ContentTier = body.contentTier === "full" ? "full" : "deploy";
  const skipImage = body.skipImage === true;
  const fastImage = body.fastImage !== false;

  if (!siteId || !topic) {
    return NextResponse.json({ error: "siteId and topic are required" }, { status: 400 });
  }

  const site = await loadOwnedSite(supabase, user.id, siteId);
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

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
        contentTier,
        skipImage,
        fastImage: skipImage ? false : fastImage,
      });
      return NextResponse.json(result);
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Generation failed";
    }
  }

  return NextResponse.json({ error: lastError }, { status: 500 });
}
