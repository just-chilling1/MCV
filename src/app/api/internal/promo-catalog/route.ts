import { NextResponse } from "next/server";
import { controlPlaneAuthError } from "@/lib/control-plane-auth";
import { readCatalog } from "@/lib/control-plane-catalog";
import { loadStoredCatalog, saveStoredCatalog } from "@/lib/control-plane-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = controlPlaneAuthError(request);
  if (denied) return denied;
  return NextResponse.json(await loadStoredCatalog());
}

export async function PUT(request: Request) {
  const denied = controlPlaneAuthError(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const catalog = readCatalog(body);
    catalog.addGroups = ["sidebar"];
    await saveStoredCatalog(catalog);
    return NextResponse.json({ ...catalog, storage: "saved" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save catalog.";
    const status = /missing|schema|does not exist|SUPABASE_SERVICE_ROLE_KEY/i.test(message) ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
