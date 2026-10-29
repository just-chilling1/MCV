import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { buildDeploySlots } from "@/features/blog-builder/lib/deploy-slots";
import { loadActiveUserSite } from "@/features/blog-builder/lib/load-user-site";
import { getDailyGenerationQuota } from "@/features/blog-builder/lib/site-quota";
import type { BlogPost, BlogSite } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";

/** Server-side deploy snapshot — site, posts, and wizard session (no client storage). */
export async function GET() {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const [{ data: session }, quota] = await Promise.all([
    supabase.from("blog_builder_sessions").select("*").eq("user_id", user.id).maybeSingle(),
    getDailyGenerationQuota(supabase, user.id),
  ]);

  const site = await loadActiveUserSite(supabase, user.id, session?.site_id);

  let posts: unknown[] = [];
  if (site?.id) {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("site_id", site.id)
      .order("is_pillar", { ascending: false })
      .order("created_at", { ascending: true });
    posts = data ?? [];
  }

  const slots = site ? buildDeploySlots(site as BlogSite, (posts ?? []) as BlogPost[]) : [];

  const completedCount = slots.filter((s) => s.status === "complete").length;
  const totalCount = slots.length;
  const isProductSite =
    site?.site_type === "product" || Boolean((site as { sales_page_html?: string })?.sales_page_html);

  const canResume =
    Boolean(site) &&
    Boolean(session?.site_id) &&
    session.site_id === site?.id &&
    !session?.deployed &&
    isProductSite &&
    !(site as { sales_page_html?: string })?.sales_page_html;

  const blogCanResume =
    Boolean(site) &&
    Boolean(session?.site_id) &&
    session.site_id === site?.id &&
    !session?.deployed &&
    !isProductSite &&
    completedCount > 0 &&
    completedCount < totalCount;

  return NextResponse.json(
    {
      session,
      site,
      posts,
      slots,
      completedCount,
      totalCount,
      canResume: canResume || blogCanResume,
      isProductSite,
      quota,
    },
    { headers: NO_STORE_HEADERS }
  );
}
