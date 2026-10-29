import { NextResponse } from "next/server";
import {
  evaluateSpecialistEligibility,
  resolveRequestCountry,
} from "@/lib/specialist-popup-eligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const country = resolveRequestCountry(request);
  const result = evaluateSpecialistEligibility(country, new Date());

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
