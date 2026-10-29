import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser, getServiceRoleClient } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { getServerAppUrl } from "@/lib/app-url";
import { cloneAcceleratorTemplate } from "@/features/premium-accelerator/lib/clone-template";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Clone a pre-seeded accelerator template with the member's affiliate link. */
export async function POST(request: Request) {
  const guard = featureApiGuard("premium-accelerator");
  if (guard) return guard;

  const { user, supabase } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const admin = getServiceRoleClient();
  const db = admin ?? supabase;

  const body = await request.json().catch(() => ({}));
  const catalogId = typeof body.catalogId === "number" ? body.catalogId : Number(body.catalogId);
  const affiliateUrl = typeof body.affiliateUrl === "string" ? body.affiliateUrl.trim() : "";

  if (!catalogId || Number.isNaN(catalogId)) {
    return NextResponse.json({ error: "catalogId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }
  if (!affiliateUrl) {
    return NextResponse.json({ error: "affiliateUrl is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    const result = await cloneAcceleratorTemplate({
      db,
      userId: user.id,
      catalogId,
      affiliateUrl,
      appUrl: getServerAppUrl(request),
    });

    return NextResponse.json(
      {
        site: result.site,
        threadsCopied: result.threadsCopied,
        siteUrl: `/sites/${result.site.slug}`,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Clone failed";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
