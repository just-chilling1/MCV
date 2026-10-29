import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { isFeatureEnabled } from "@/config/features.config";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS, PRIVATE_READ_CACHE_HEADERS } from "@/lib/api-cache-headers";
import type { ArmedLink } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";

/** Shared by Sales Offer Generator and Library → Link Vault. */
function linkVaultGuard() {
  if (isFeatureEnabled("blog-builder") || isFeatureEnabled("money-links-vault")) {
    return null;
  }
  return featureApiGuard("blog-builder");
}

export async function GET() {
  const guard = linkVaultGuard();
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { data, error } = await supabase
    .from("link_vault")
    .select("links")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[link-vault GET]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const links = (data?.links ?? []) as ArmedLink[];
  return NextResponse.json({ links }, { headers: PRIVATE_READ_CACHE_HEADERS });
}

export async function PUT(request: Request) {
  const guard = linkVaultGuard();
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json();
  const links = Array.isArray(body.links) ? (body.links as ArmedLink[]) : [];

  const { data, error } = await supabase
    .from("link_vault")
    .upsert(
      {
        user_id: user.id,
        links,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("links")
    .single();

  if (error) {
    console.error("[link-vault PUT]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ links: data.links }, { headers: NO_STORE_HEADERS });
}
