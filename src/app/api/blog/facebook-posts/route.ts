import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser, getServiceRoleClient } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { buildOfferPageUrl, getServerAppUrl } from "@/lib/app-url";
import {
  listFacebookPostsForSite,
  saveFacebookPostBatch,
} from "@/features/blog-builder/lib/facebook-posts-vault";
import { generateFacebookPostsForOffer } from "@/features/publish-kit/lib/generate-facebook-posts";
import type { BlogSite } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function loadOwnedSite(
  supabase: Awaited<ReturnType<typeof getApiUser>>["supabase"],
  userId: string,
  siteId: string
) {
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("user_id", userId)
    .maybeSingle();

  return (site as BlogSite | null) ?? null;
}

/** List saved Facebook posts for a money site. */
export async function GET(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const siteId = new URL(request.url).searchParams.get("siteId") ?? "";
  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const site = await loadOwnedSite(supabase, user.id, siteId);
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  try {
    const posts = await listFacebookPostsForSite(supabase, user.id, siteId);
    return NextResponse.json({ posts, slug: site.slug, count: posts.length }, { headers: NO_STORE_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load posts";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/** Generate and append Facebook posts for a money site. */
export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const siteId = typeof body.siteId === "string" ? body.siteId : "";
  if (!siteId) return NextResponse.json({ error: "siteId is required" }, { status: 400 });

  const typedSite = await loadOwnedSite(supabase, user.id, siteId);
  if (!typedSite) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const promoLink = buildOfferPageUrl(getServerAppUrl(request), typedSite.slug);

  try {
    const scrapeClient = getServiceRoleClient();
    const generated = await generateFacebookPostsForOffer({
      site: typedSite,
      promoLink,
      scrapeClient,
    });

    const saved = await saveFacebookPostBatch(supabase, user.id, siteId, generated);

    return NextResponse.json({
      posts: saved,
      slug: typedSite.slug,
      batchCount: saved.length,
      totalSaved: saved.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    const status = msg.includes("no posts") ? 502 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
