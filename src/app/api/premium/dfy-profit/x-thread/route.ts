import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser, getServiceRoleClient } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { buildOfferPageUrl, getServerAppUrl } from "@/lib/app-url";
import { generateWithGPT, extractJsonFromText } from "@/features/blog-builder/lib/ai";
import { scrapePageWithCache } from "@/features/blog-builder/lib/scrape-cache";
import { loadOwnedSite } from "@/features/blog-builder/lib/generation-pipeline";
import { buildSitePromoteContext } from "@/features/publish-kit/lib/site-context";
import { generateThreadImagesForPosts } from "@/features/publish-kit/lib/thread-images";
import { THREAD_IMAGE_POST_INDEXES, THREAD_POST_ROLES, THREADS_PER_GENERATION } from "@/features/publish-kit/lib/promote-constants";
import { buildThreadSystemPrompt, buildThreadUserPrompt } from "@/features/publish-kit/lib/x-thread-rules";
import { saveXThreadBatch } from "@/features/publish-kit/lib/x-threads-vault";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type GeneratedThreadPost = { text?: string; role?: string; angle?: string };

export async function POST(request: Request) {
  const guard = featureApiGuard("premium-dfy-profit");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const site = await loadOwnedSite(supabase, user.id, siteId);
  if (!site) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const affiliateUrl = site.armed_links?.[0]?.url?.trim() || "";
  let scrapedProductContext = "";
  if (affiliateUrl) {
    try {
      const { context } = await scrapePageWithCache(affiliateUrl, getServiceRoleClient());
      scrapedProductContext = context;
    } catch {
      /* the generator can use saved offer data without a scrape */
    }
  }

  const promoLink = buildOfferPageUrl(getServerAppUrl(request), site.slug, site.owner_handle);
  const context = buildSitePromoteContext({
    site,
    siteUrl: promoLink,
    scrapedProductContext,
  });

  try {
    const raw = await generateWithGPT(
      buildThreadSystemPrompt("X (Twitter)"),
      buildThreadUserPrompt({
        fullContext: context.fullContext,
        promoLink,
        postCount: THREADS_PER_GENERATION,
      }),
      { temperature: 0.82, maxRetries: 4, timeoutMs: 120_000 }
    );
    const parsed = extractJsonFromText(raw) as { posts?: GeneratedThreadPost[] } | null;
    const posts = (Array.isArray(parsed?.posts) ? parsed.posts : [])
      .filter((post): post is Required<Pick<GeneratedThreadPost, "text">> & GeneratedThreadPost =>
        Boolean(post?.text?.trim())
      )
      .slice(0, THREADS_PER_GENERATION)
      .map((post, index) => ({
        text: post.text.trim(),
        angle: post.role?.trim() || post.angle?.trim() || THREAD_POST_ROLES[index] || `Post ${index + 1}`,
      }));

    if (posts.length !== THREADS_PER_GENERATION) {
      return NextResponse.json(
        { error: "The generator returned an incomplete X story thread. Please try again." },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    const imageResults = await generateThreadImagesForPosts({
      posts,
      postIndexes: THREAD_IMAGE_POST_INDEXES,
      territory: context.territory,
      productName: site.title,
      hobby: site.hobby,
      userId: user.id,
      supabase,
      scrapeUrl: affiliateUrl || undefined,
    });
    const postsWithImages = posts.map((post, index) => {
      const imageSlot = THREAD_IMAGE_POST_INDEXES.indexOf(
        index as (typeof THREAD_IMAGE_POST_INDEXES)[number]
      );
      return { ...post, imageUrl: imageSlot >= 0 ? imageResults[imageSlot] ?? undefined : undefined };
    });
    const saved = await saveXThreadBatch(supabase, user.id, siteId, postsWithImages);

    return NextResponse.json(
      {
        posts: saved.map((post) => ({
          id: post.id,
          text: post.text,
          angle: post.angle,
          imageUrl: post.image_url,
        })),
        batchId: saved[0]?.batch_id ?? null,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "X thread generation failed";
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
