import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { backfillMissingPostImages } from "@/features/blog-builder/lib/generation-pipeline";

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
    .update({ status: "live" })
    .eq("id", siteId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (siteError || !site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const { error: postsError } = await supabase
    .from("posts")
    .update({ status: "live", publish_at: new Date().toISOString() })
    .eq("site_id", siteId)
    .eq("user_id", user.id);

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  const isProductSite = site.site_type === "product" || Boolean(site.sales_page_html);

  if (!isProductSite) {
    // Server-side safety net: make sure every post has a persisted hero image,
    // rather than relying on the browser finishing the background attach.
    try {
      await backfillMissingPostImages(supabase, user.id, siteId);
    } catch (err) {
      console.error("[publish] image backfill failed", err);
    }
  }

  await supabase
    .from("blog_builder_sessions")
    .upsert(
      {
        user_id: user.id,
        deployed: true,
        is_generating: false,
        step: 3,
        site_id: siteId,
        site_slug: site.slug,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return NextResponse.json({ site, published: true });
}
