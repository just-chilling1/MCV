import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser, getServiceRoleClient } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { getServerAppUrl } from "@/lib/app-url";
import { loadAcceleratorTemplatePreview } from "@/features/premium-accelerator/lib/load-template-preview";
import { backfillAcceleratorTemplateImages } from "@/features/premium-accelerator/lib/seed-templates";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Return sales page HTML + X thread posts for preview (no clone). */
export async function GET(request: Request) {
  const guard = featureApiGuard("premium-accelerator");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const url = new URL(request.url);
  const catalogId = Number(url.searchParams.get("catalogId"));
  const affiliateUrl = url.searchParams.get("affiliateUrl")?.trim() || undefined;

  if (!catalogId || Number.isNaN(catalogId)) {
    return NextResponse.json({ error: "catalogId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    const admin = getServiceRoleClient();
    const db = admin ?? supabase;

    if (admin) {
      try {
        await backfillAcceleratorTemplateImages(admin, catalogId);
      } catch (err) {
        console.warn("[accelerator/preview] image backfill skipped:", err);
      }
    }

    const preview = await loadAcceleratorTemplatePreview({
      db,
      catalogId,
      affiliateUrl,
      appUrl: getServerAppUrl(request),
    });
    return NextResponse.json(preview, { headers: NO_STORE_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load preview";
    const status = msg.includes("not found") || msg.includes("not been seeded") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status, headers: NO_STORE_HEADERS });
  }
}
