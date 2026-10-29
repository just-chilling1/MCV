import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/config/features.config";

export function featureApiGuard(feature: Parameters<typeof isFeatureEnabled>[0]) {
  if (!isFeatureEnabled(feature)) {
    return NextResponse.json({ error: "Feature not enabled" }, { status: 404 });
  }
  return null;
}
