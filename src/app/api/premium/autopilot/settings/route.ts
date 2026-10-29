import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS, PRIVATE_READ_CACHE_HEADERS } from "@/lib/api-cache-headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = featureApiGuard("premium-autopilot");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const [settingsResult, completionsResult] = await Promise.all([
    supabase
      .from("user_premium_settings")
      .select("autopilot_promotion_url, autopilot_selected_niche")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_autopilot_completions")
      .select("source_id")
      .eq("user_id", user.id),
  ]);

  if (settingsResult.error) {
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  if (completionsResult.error) {
    return NextResponse.json(
      { error: "Failed to load completions" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      promotion_url: settingsResult.data?.autopilot_promotion_url ?? null,
      selected_niche: settingsResult.data?.autopilot_selected_niche ?? "All",
      completed_source_ids: (completionsResult.data ?? []).map((r) => r.source_id as string),
    },
    { headers: PRIVATE_READ_CACHE_HEADERS }
  );
}

export async function PATCH(request: Request) {
  const guard = featureApiGuard("premium-autopilot");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = (await request.json().catch(() => ({}))) as {
    promotion_url?: string | null;
    selected_niche?: string | null;
  };

  const patch: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  if ("promotion_url" in body) {
    const url = typeof body.promotion_url === "string" ? body.promotion_url.trim() : null;
    patch.autopilot_promotion_url = url || null;
  }

  if ("selected_niche" in body) {
    const niche =
      typeof body.selected_niche === "string" && body.selected_niche.trim()
        ? body.selected_niche.trim()
        : "All";
    patch.autopilot_selected_niche = niche;
  }

  if (!("promotion_url" in body) && !("selected_niche" in body)) {
    return NextResponse.json(
      { error: "promotion_url or selected_niche required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { data, error } = await supabase
    .from("user_premium_settings")
    .upsert(patch, { onConflict: "user_id" })
    .select("autopilot_promotion_url, autopilot_selected_niche")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      promotion_url: data.autopilot_promotion_url ?? null,
      selected_niche: data.autopilot_selected_niche ?? "All",
    },
    { headers: NO_STORE_HEADERS }
  );
}
