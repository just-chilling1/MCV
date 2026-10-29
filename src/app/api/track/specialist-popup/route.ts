import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveRequestCountry } from "@/lib/specialist-popup-eligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set(["cta_call_click", "popup_open"]);

export async function POST(request: Request) {
  try {
    const raw = await request.text().catch(() => "");
    let body: { event?: unknown } = {};
    if (raw) {
      try {
        body = JSON.parse(raw) as { event?: unknown };
      } catch {
        body = {};
      }
    }
    const event =
      typeof body.event === "string" && ALLOWED_EVENTS.has(body.event)
        ? body.event
        : "cta_call_click";

    const supabase = await createClient();
    // Validate the session so auth.uid() is available inside the SECURITY DEFINER RPC.
    await supabase.auth.getUser();

    const { error } = await supabase.rpc("track_specialist_popup", {
      p_event: event,
      p_country: resolveRequestCountry(request),
      p_user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    });

    if (error) {
      console.error("specialist popup tracking insert failed:", error.message);
    }
  } catch (err) {
    console.error("specialist popup tracking error:", err);
  }

  return new NextResponse(null, { status: 204 });
}
