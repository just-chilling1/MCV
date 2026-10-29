import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { getDailyGenerationQuota } from "@/features/blog-builder/lib/site-quota";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const quota = await getDailyGenerationQuota(supabase, user.id);
  return NextResponse.json({ quota }, { headers: NO_STORE_HEADERS });
}
