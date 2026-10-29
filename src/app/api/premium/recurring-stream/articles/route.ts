import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser, getServiceRoleClient } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import {
  listRecurringStreamArticles,
  countSeededRecurringArticles,
  seedRecurringStreamArticles,
} from "@/features/premium-recurring/lib/seed-articles";
import { RECURRING_STREAM_TARGET_COUNT } from "@/features/premium-recurring/lib/catalog";
import { saveRecurringArticle } from "@/features/premium-recurring/lib/recurring-articles-vault";
import { loadRecurringArticlePreview } from "@/features/premium-recurring/lib/load-article-preview";
import type { BlogSite } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = featureApiGuard("premium-recurring");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const url = new URL(request.url);
  const niche = url.searchParams.get("niche")?.trim() || "All";
  const previewArticleId = Number(url.searchParams.get("articleId"));
  const previewSiteId = url.searchParams.get("siteId")?.trim() || "";

  try {
    const admin = getServiceRoleClient();
    const reader = admin ?? supabase;

    if (previewArticleId && !Number.isNaN(previewArticleId) && previewSiteId) {
      const { data: siteRow } = await supabase
        .from("sites")
        .select("*")
        .eq("id", previewSiteId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!siteRow) {
        return NextResponse.json({ error: "Offer not found" }, { status: 404, headers: NO_STORE_HEADERS });
      }

      const preview = await loadRecurringArticlePreview(reader, previewArticleId, siteRow as BlogSite);
      return NextResponse.json(preview, { headers: NO_STORE_HEADERS });
    }

    // Seed is admin-only via secret-gated PUT — never trigger expensive work on anonymous/list GET.
    const articles = await listRecurringStreamArticles(reader, niche);
    const seededCount = admin ? await countSeededRecurringArticles(admin) : articles.length;

    return NextResponse.json(
      {
        articles: articles.map((a) => ({
          id: a.id,
          niche: a.niche,
          title: a.title,
          excerpt: a.excerpt,
          angle: a.angle,
        })),
        total: RECURRING_STREAM_TARGET_COUNT,
        seededCount,
        ready: seededCount >= RECURRING_STREAM_TARGET_COUNT,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load articles";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/** Return full article HTML with offer affiliate link woven in; saves to the offer. */
export async function POST(request: Request) {
  const guard = featureApiGuard("premium-recurring");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const articleId = typeof body.articleId === "number" ? body.articleId : Number(body.articleId);
  const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";

  if (!articleId || Number.isNaN(articleId)) {
    return NextResponse.json({ error: "articleId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

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
    return NextResponse.json({ error: "Offer not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const site = siteRow as BlogSite;

  const admin = getServiceRoleClient();
  const reader = admin ?? supabase;

  let preview;
  try {
    preview = await loadRecurringArticlePreview(reader, articleId, site);
  } catch {
    return NextResponse.json({ error: "Article not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const saved = await saveRecurringArticle(
    supabase,
    user.id,
    siteId,
    articleId,
    preview.title,
    preview.html
  );

  return NextResponse.json(
    {
      id: preview.id,
      title: preview.title,
      html: preview.html,
      excerpt: preview.excerpt,
      metaDescription: preview.metaDescription,
      savedId: saved.id,
      promoLink: preview.promoLink,
    },
    { headers: NO_STORE_HEADERS }
  );
}

/** Admin one-time seed — requires RECURRING_SEED_SECRET header. */
export async function PUT(request: Request) {
  const secret = process.env.RECURRING_SEED_SECRET?.trim();
  const header = request.headers.get("x-recurring-seed-secret")?.trim();

  if (!secret || header !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
  }

  const admin = getServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500, headers: NO_STORE_HEADERS });
  }

  try {
    const force =
      new URL(request.url).searchParams.get("force") === "1" ||
      request.headers.get("x-recurring-force-reseed") === "1";
    const result = await seedRecurringStreamArticles(admin, { force });
    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Seed failed";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
