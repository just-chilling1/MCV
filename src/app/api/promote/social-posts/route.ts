import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser, getServiceRoleClient } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { generateWithGPT, extractJsonFromText } from "@/features/blog-builder/lib/ai";
import { scrapePageWithCache } from "@/features/blog-builder/lib/scrape-cache";
import { getServerAppUrl, buildOfferPageUrl } from "@/lib/app-url";
import { buildSitePromoteContext } from "@/features/publish-kit/lib/site-context";
import {
  getThreadGenerationQuota,
  recordThreadGeneration,
  THREAD_GENERATION_DAILY_LIMIT,
} from "@/features/publish-kit/lib/thread-generation-quota";
import {
  THREADS_PER_GENERATION,
  THREAD_IMAGE_POST_INDEXES,
  THREAD_POST_ROLES,
} from "@/features/publish-kit/lib/promote-constants";
import {
  buildThreadSystemPrompt,
  buildThreadUserPrompt,
} from "@/features/publish-kit/lib/x-thread-rules";
import {
  deleteXThreadBatch,
  listXThreadsForSite,
  renameXThreadBatch,
  saveXThreadBatch,
  setXThreadBatchPinned,
  ThreadColumnsMissingError,
} from "@/features/publish-kit/lib/x-threads-vault";
import { listXTagsForSite } from "@/features/publish-kit/lib/x-tags-vault";
import { generateThreadImagesForPosts } from "@/features/publish-kit/lib/thread-images";
import type { BlogSite } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface SocialPostRow {
  text: string;
  angle?: string;
  role?: string;
  imageUrl?: string;
}

export async function GET(request: Request) {
  const guard = featureApiGuard("article-publish");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const siteId = new URL(request.url).searchParams.get("siteId")?.trim() || "";
  const quota = await getThreadGenerationQuota(supabase, user.id);

  if (siteId) {
    const [threads, tagRows] = await Promise.all([
      listXThreadsForSite(supabase, user.id, siteId),
      listXTagsForSite(supabase, user.id, siteId),
    ]);
    const tags = tagRows.map((row) => ({ tag: row.tag, reason: row.reason || "" }));
    return NextResponse.json({ quota, threads, tags }, { headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ quota }, { headers: NO_STORE_HEADERS });
}

export async function DELETE(request: Request) {
  const guard = featureApiGuard("article-publish");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const params = new URL(request.url).searchParams;
  const siteId = params.get("siteId")?.trim() || "";
  const batchId = params.get("batchId")?.trim() || "";

  if (!siteId || !batchId) {
    return NextResponse.json(
      { error: "siteId and batchId are required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    await deleteXThreadBatch(supabase, user.id, siteId, batchId);
    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete thread";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

const MAX_THREAD_LABEL_LENGTH = 60;

export async function PATCH(request: Request) {
  const guard = featureApiGuard("article-publish");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
  const batchId = typeof body.batchId === "string" ? body.batchId.trim() : "";
  const action = typeof body.action === "string" ? body.action : "";

  if (!siteId || !batchId) {
    return NextResponse.json(
      { error: "siteId and batchId are required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    if (action === "rename") {
      const label =
        typeof body.label === "string"
          ? body.label.trim().slice(0, MAX_THREAD_LABEL_LENGTH)
          : "";
      await renameXThreadBatch(supabase, user.id, siteId, batchId, label || null);
      return NextResponse.json({ ok: true, label: label || null }, { headers: NO_STORE_HEADERS });
    }

    if (action === "pin" || action === "unpin") {
      await setXThreadBatchPinned(supabase, user.id, siteId, batchId, action === "pin");
      return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
    }

    return NextResponse.json(
      { error: "action must be rename, pin, or unpin" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  } catch (e) {
    if (e instanceof ThreadColumnsMissingError) {
      return NextResponse.json({ error: e.message }, { status: 409, headers: NO_STORE_HEADERS });
    }
    const msg = e instanceof Error ? e.message : "Failed to update thread";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function POST(request: Request) {
  const guard = featureApiGuard("article-publish");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
  const siteUrlInput = typeof body.siteUrl === "string" ? body.siteUrl.trim() : "";
  const platform = "twitter" as const;

  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const { data: siteRow } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!siteRow) {
    return NextResponse.json({ error: "Site not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const quota = await getThreadGenerationQuota(supabase, user.id);
  if (quota.remaining <= 0) {
    return NextResponse.json(
      {
        error: `Daily limit reached (${THREAD_GENERATION_DAILY_LIMIT} generations per day). Try again tomorrow.`,
        quota,
      },
      { status: 429, headers: NO_STORE_HEADERS }
    );
  }

  const site = siteRow as BlogSite;
  const affiliateUrl = site.armed_links?.[0]?.url?.trim() || "";
  let scrapedProductContext = "";

  if (affiliateUrl) {
    try {
      const admin = getServiceRoleClient();
      const { context } = await scrapePageWithCache(affiliateUrl, admin);
      scrapedProductContext = context || "";
    } catch {
      /* continue without scrape */
    }
  }

  const offerPageUrl =
    siteUrlInput || buildOfferPageUrl(getServerAppUrl(request), site.slug, site.owner_handle);
  const context = buildSitePromoteContext({ site, siteUrl: offerPageUrl, scrapedProductContext });
  const promoLink = offerPageUrl;

  const platformLabel = "X (Twitter)";
  const system = buildThreadSystemPrompt(platformLabel);
  const userPrompt = buildThreadUserPrompt({
    fullContext: context.fullContext,
    promoLink,
    postCount: THREADS_PER_GENERATION,
  });

  try {
    const raw = await generateWithGPT(system, userPrompt, {
      temperature: 0.82,
      maxRetries: 4,
      timeoutMs: 120_000,
    });

    const parsed = extractJsonFromText(raw) as { posts?: SocialPostRow[] } | null;

    const posts = (Array.isArray(parsed?.posts) ? parsed!.posts : [])
      .filter((row) => row && typeof row.text === "string" && row.text.trim().length > 0)
      .slice(0, THREADS_PER_GENERATION)
      .map((row, i) => ({
        text: row.text.trim(),
        angle:
          typeof row.role === "string" && row.role.trim()
            ? row.role.trim()
            : typeof row.angle === "string" && row.angle.trim()
              ? row.angle.trim()
              : THREAD_POST_ROLES[i] || `Post ${i + 1}`,
      }));

    if (posts.length === 0) {
      return NextResponse.json(
        { error: "The generator returned no thread posts. Please try again." },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    const territory = context.territory;
    const extraScrapeUrls = offerPageUrl !== affiliateUrl ? [offerPageUrl] : [];
    const imageResults = await generateThreadImagesForPosts({
      posts,
      postIndexes: THREAD_IMAGE_POST_INDEXES,
      territory,
      hobby: site.hobby?.trim() || undefined,
      productName: site.title || context.siteName,
      userId: user.id,
      supabase,
      scrapeUrl: affiliateUrl || undefined,
      scrapeUrls: extraScrapeUrls.length ? extraScrapeUrls : undefined,
    });

    const postsWithImages = posts.map((post, i) => {
      const imageSlot = THREAD_IMAGE_POST_INDEXES.indexOf(
        i as (typeof THREAD_IMAGE_POST_INDEXES)[number]
      );
      return {
        ...post,
        imageUrl: imageSlot >= 0 ? imageResults[imageSlot] || undefined : undefined,
      };
    });

    await recordThreadGeneration(supabase, user.id, siteId);
    const saved = await saveXThreadBatch(supabase, user.id, siteId, postsWithImages);
    const quotaAfter = await getThreadGenerationQuota(supabase, user.id);

    return NextResponse.json(
      {
        platform,
        posts: postsWithImages,
        batchId: saved[0]?.batch_id ?? null,
        promoLink,
        quota: quotaAfter,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate X thread";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
