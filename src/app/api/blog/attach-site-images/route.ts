import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { attachSiteImages } from "@/features/blog-builder/lib/generation-pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Attach hero + inline images for a batch of posts with one shared dedupe pool. */
export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const rawItems = Array.isArray(body.items) ? body.items : [];

  const items = rawItems
    .map((row: unknown, index: number) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const postId = typeof r.postId === "string" ? r.postId : "";
      if (!postId) return null;

      const prefetchedRaw = r.prefetched;
      const prefetched =
        prefetchedRaw &&
        typeof prefetchedRaw === "object" &&
        typeof (prefetchedRaw as { url?: string }).url === "string" &&
        (prefetchedRaw as { url: string }).url.startsWith("http")
          ? {
              url: (prefetchedRaw as { url: string }).url,
              alt:
                typeof (prefetchedRaw as { alt?: string }).alt === "string"
                  ? (prefetchedRaw as { alt: string }).alt
                  : "Hero image",
              stockId:
                typeof (prefetchedRaw as { stockId?: string }).stockId === "string"
                  ? (prefetchedRaw as { stockId: string }).stockId
                  : undefined,
            }
          : typeof r.url === "string" && r.url.startsWith("http")
            ? {
                url: r.url,
                alt: typeof r.alt === "string" ? r.alt : "Hero image",
                stockId: typeof r.stockId === "string" ? r.stockId : undefined,
              }
            : null;

      const postIndex =
        typeof r.postIndex === "number" ? r.postIndex : index;

      return { postId, prefetched, postIndex };
    })
    .filter(Boolean) as Array<{
    postId: string;
    prefetched: { url: string; alt: string; stockId?: string } | null;
    postIndex: number;
  }>;

  if (items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }

  const seedRaw = body.seed;
  const seed =
    seedRaw && typeof seedRaw === "object"
      ? {
          excludeUrls: Array.isArray((seedRaw as { excludeUrls?: unknown }).excludeUrls)
            ? ((seedRaw as { excludeUrls: unknown[] }).excludeUrls.filter(
                (u): u is string => typeof u === "string"
              ) as string[])
            : [],
          excludeStockIds: Array.isArray((seedRaw as { excludeStockIds?: unknown }).excludeStockIds)
            ? ((seedRaw as { excludeStockIds: unknown[] }).excludeStockIds.filter(
                (id): id is string => typeof id === "string"
              ) as string[])
            : [],
        }
      : undefined;

  try {
    const { posts, attached, pool } = await attachSiteImages({
      supabase,
      userId: user.id,
      items,
      seed,
    });
    return NextResponse.json({ posts, attached, count: posts.length, pool });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Image attach failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
