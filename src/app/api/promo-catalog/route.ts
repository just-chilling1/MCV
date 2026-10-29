import { NextResponse } from "next/server";
import { loadStoredCatalog } from "@/lib/control-plane-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await loadStoredCatalog();
  return NextResponse.json(catalog);
}
