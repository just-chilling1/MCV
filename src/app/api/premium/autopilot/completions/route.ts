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

  const { data, error } = await supabase
    .from("user_autopilot_completions")
    .select("source_id")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load completions" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { source_ids: (data ?? []).map((r) => r.source_id as string) },
    { headers: PRIVATE_READ_CACHE_HEADERS }
  );
}

export async function POST(request: Request) {
  const guard = featureApiGuard("premium-autopilot");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = (await request.json().catch(() => ({}))) as {
    source_id?: string;
    source_ids?: string[];
  };

  const ids = (
    body.source_ids ?? (typeof body.source_id === "string" ? [body.source_id] : [])
  )
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "source_id required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const now = new Date().toISOString();
  const rows = ids.map((source_id) => ({
    user_id: user.id,
    source_id,
    completed_at: now,
  }));

  const { error } = await supabase
    .from("user_autopilot_completions")
    .upsert(rows, { onConflict: "user_id,source_id" });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to save completion" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}

export async function DELETE(request: Request) {
  const guard = featureApiGuard("premium-autopilot");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("source_id")?.trim();

  if (!sourceId) {
    return NextResponse.json(
      { error: "source_id required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { error } = await supabase
    .from("user_autopilot_completions")
    .delete()
    .eq("user_id", user.id)
    .eq("source_id", sourceId);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to remove completion" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
