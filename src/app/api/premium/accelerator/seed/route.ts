import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { seedAcceleratorBatch } from "@/features/premium-accelerator/lib/seed-templates";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * One-time admin seed for accelerator templates.
 * Requires ACCELERATOR_SEED_SECRET header matching env.
 * Query: ?offset=0&limit=25
 */
export async function POST(request: Request) {
  const secret = process.env.ACCELERATOR_SEED_SECRET?.trim();
  const header = request.headers.get("x-accelerator-seed-secret")?.trim();

  if (!secret || header !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
  }

  const admin = getServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 25)));

  try {
    const result = await seedAcceleratorBatch(admin, offset, limit);
    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Seed failed";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
