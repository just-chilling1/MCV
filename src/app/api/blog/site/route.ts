import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS, PRIVATE_READ_CACHE_HEADERS } from "@/lib/api-cache-headers";
import { countRowsBySiteIds } from "@/lib/site-counts";
import { getDailyGenerationQuota } from "@/features/blog-builder/lib/site-quota";
import { countFacebookPostsBySite, listFacebookPostsForSite } from "@/features/blog-builder/lib/facebook-posts-vault";
import { buildOfferPageUrl, getServerAppUrl, resolveOfferPageLinksInText } from "@/lib/app-url";
import { countXThreadsBySite, listXThreadsForSite } from "@/features/publish-kit/lib/x-threads-vault";
import {
  countRecurringArticlesBySite,
  listRecurringArticlesForSite,
} from "@/features/premium-recurring/lib/recurring-articles-vault";
import {
  detectLinkNetwork,
  isValidAffiliateUrl,
  normalizeAffiliateUrl,
} from "@/features/blog-builder/lib/affiliate-url";
import type { ArmedLink, BlogSite } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";

const SITE_LIST_COLUMNS =
  "id, user_id, hobby, territory, title, tagline, slug, owner_handle, theme, theme_config, armed_links, status, site_type, created_at, is_template, template_key";

export interface SiteVaultSummary {
  site: BlogSite;
  postCount: number;
  livePostCount: number;
  clickCount: number;
  facebookPostCount: number;
  xThreadCount: number;
  recurringArticleCount: number;
}

function readCacheHeaders(lite: boolean) {
  return lite ? PRIVATE_READ_CACHE_HEADERS : NO_STORE_HEADERS;
}

export async function GET(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const siteId = new URL(request.url).searchParams.get("siteId");
  const lite = new URL(request.url).searchParams.get("lite") === "1";
  const quota = await getDailyGenerationQuota(supabase, user.id);

  const { data: sites } = lite
    ? await supabase
        .from("sites")
        .select(SITE_LIST_COLUMNS)
        .eq("user_id", user.id)
        .eq("is_template", false)
        .order("created_at", { ascending: false })
    : await supabase
        .from("sites")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_template", false)
        .order("created_at", { ascending: false });

  const siteList = (sites ?? []) as BlogSite[];
  const siteIds = siteList.map((s) => s.id);

  if (siteIds.length === 0) {
    return NextResponse.json(
      { summaries: [], site: null, posts: [], clicks: 0, quota, activeSiteId: null },
      { headers: NO_STORE_HEADERS }
    );
  }

  if (lite && !siteId) {
    const [facebookPostCounts, xThreadCounts, recurringArticleCounts, clickCounts] =
      await Promise.all([
        countFacebookPostsBySite(supabase, user.id, siteIds).catch(() => ({} as Record<string, number>)),
        countXThreadsBySite(supabase, user.id, siteIds).catch(() => ({} as Record<string, number>)),
        countRecurringArticlesBySite(supabase, user.id, siteIds).catch(() => ({} as Record<string, number>)),
        countRowsBySiteIds(supabase, "affiliate_clicks", siteIds),
      ]);

    const summaries: SiteVaultSummary[] = siteList.map((site) => ({
      site,
      postCount: 0,
      livePostCount: 0,
      clickCount: clickCounts[site.id] ?? 0,
      facebookPostCount: facebookPostCounts[site.id] ?? 0,
      xThreadCount: xThreadCounts[site.id] ?? 0,
      recurringArticleCount: recurringArticleCounts[site.id] ?? 0,
    }));

    return NextResponse.json({ summaries, quota }, { headers: readCacheHeaders(true) });
  }

  const { data: session } = await supabase
    .from("blog_builder_sessions")
    .select("site_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const [postCounts, livePostCounts, clickCounts, facebookPostCounts, xThreadCounts, recurringArticleCounts] =
    await Promise.all([
      countRowsBySiteIds(supabase, "posts", siteIds),
      countRowsBySiteIds(supabase, "posts", siteIds, { status: "live" }),
      countRowsBySiteIds(supabase, "affiliate_clicks", siteIds),
      countFacebookPostsBySite(supabase, user.id, siteIds).catch(() => ({} as Record<string, number>)),
      countXThreadsBySite(supabase, user.id, siteIds).catch(() => ({} as Record<string, number>)),
      countRecurringArticlesBySite(supabase, user.id, siteIds).catch(() => ({} as Record<string, number>)),
    ]);

  const summaries: SiteVaultSummary[] = siteList.map((site) => ({
    site,
    postCount: postCounts[site.id] ?? 0,
    livePostCount: livePostCounts[site.id] ?? 0,
    clickCount: clickCounts[site.id] ?? 0,
    facebookPostCount: facebookPostCounts[site.id] ?? 0,
    xThreadCount: xThreadCounts[site.id] ?? 0,
    recurringArticleCount: recurringArticleCounts[site.id] ?? 0,
  }));

  if (siteId) {
    const summary = summaries.find((s) => s.site.id === siteId);
    if (!summary) {
      return NextResponse.json({ error: "Site not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const { data: posts } = await supabase
      .from("posts")
      .select("*")
      .eq("site_id", siteId)
      .order("is_pillar", { ascending: false })
      .order("created_at", { ascending: true });

    const facebookPostsRaw = await listFacebookPostsForSite(supabase, user.id, siteId).catch(() => []);
    const offerPageUrl = buildOfferPageUrl(
      getServerAppUrl(request),
      summary.site.slug,
      summary.site.owner_handle
    );
    const facebookPosts = facebookPostsRaw.map((post) => ({
      ...post,
      body: resolveOfferPageLinksInText(post.body, offerPageUrl, summary.site.slug),
    }));
    const xThreads = await listXThreadsForSite(supabase, user.id, siteId).catch(() => []);
    const recurringArticles = await listRecurringArticlesForSite(supabase, user.id, siteId).catch(() => []);

    return NextResponse.json(
      {
        summaries,
        site: summary.site,
        posts: posts ?? [],
        facebookPosts,
        xThreads,
        recurringArticles,
        clicks: summary.clickCount,
        quota,
        activeSiteId: session?.site_id ?? null,
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  const latest = summaries[0] ?? null;

  return NextResponse.json(
    {
      summaries,
      site: latest?.site ?? null,
      posts: [],
      clicks: latest?.clickCount ?? 0,
      quota,
      activeSiteId: session?.site_id ?? null,
    },
    { headers: NO_STORE_HEADERS }
  );
}

/** Update the offer's primary affiliate link after creation. */
export async function PATCH(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
  const rawLink = (body.armedLink ?? {}) as Partial<ArmedLink>;

  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const url = normalizeAffiliateUrl(typeof rawLink.url === "string" ? rawLink.url : "");
  if (!isValidAffiliateUrl(url)) {
    return NextResponse.json(
      { error: "Enter a valid URL starting with https://" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { data: siteRow } = await supabase
    .from("sites")
    .select("id, armed_links")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .eq("is_template", false)
    .maybeSingle();

  if (!siteRow) {
    return NextResponse.json({ error: "Site not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const link: ArmedLink = {
    label: typeof rawLink.label === "string" && rawLink.label.trim() ? rawLink.label.trim() : "Promotional Offer",
    url,
    network: detectLinkNetwork(url),
    tag: typeof rawLink.tag === "string" && rawLink.tag.trim() ? rawLink.tag.trim() : undefined,
    description:
      typeof rawLink.description === "string" && rawLink.description.trim()
        ? rawLink.description.trim()
        : undefined,
  };

  const existing = Array.isArray(siteRow.armed_links) ? (siteRow.armed_links as ArmedLink[]) : [];
  const nextLinks = [link, ...existing.slice(1)];

  const { error } = await supabase
    .from("sites")
    .update({ armed_links: nextLinks })
    .eq("id", siteId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ ok: true, armedLinks: nextLinks }, { headers: NO_STORE_HEADERS });
}

export async function DELETE(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const siteId = new URL(request.url).searchParams.get("siteId")?.trim() ?? "";
  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const { data: site } = await supabase
    .from("sites")
    .select("id, title")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .eq("is_template", false)
    .maybeSingle();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  await supabase
    .from("blog_builder_sessions")
    .update({ site_id: null, site_slug: null, deployed: false })
    .eq("user_id", user.id)
    .eq("site_id", siteId);

  await supabase.from("site_facebook_posts").delete().eq("user_id", user.id).eq("site_id", siteId);
  await supabase.from("site_x_threads").delete().eq("user_id", user.id).eq("site_id", siteId);
  await supabase.from("site_x_tags").delete().eq("user_id", user.id).eq("site_id", siteId);
  await supabase.from("site_recurring_articles").delete().eq("user_id", user.id).eq("site_id", siteId);

  const { error } = await supabase.from("sites").delete().eq("id", siteId).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ ok: true, deletedSiteId: siteId }, { headers: NO_STORE_HEADERS });
}
