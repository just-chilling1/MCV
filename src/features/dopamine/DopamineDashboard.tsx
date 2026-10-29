"use client";

import { TrustBar } from "./components/TrustBar";
import { RollingEarningsCounter } from "./components/RollingEarningsCounter";
import { EarningsTestimonials } from "./components/EarningsTestimonials";
import { MilestoneTracker } from "./components/MilestoneTracker";

/**
 * Optional dashboard engagement block when `dopamine` is enabled.
 * Mount below main dashboard content — see app/dashboard/page.tsx.
 */
export function DopamineDashboard() {
  return (
    <div className="flex flex-col gap-4">
      <TrustBar />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RollingEarningsCounter />
        <MilestoneTracker />
      </div>
      <EarningsTestimonials />
    </div>
  );
}
