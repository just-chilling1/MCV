"use client";

import { Search, TrendingUp, Crown, type LucideIcon } from "lucide-react";
import { dopamineContent } from "@/config/dopamine.config";

const ICONS: Record<string, LucideIcon> = {
  Search,
  TrendingUp,
  Crown,
};

interface MilestoneTrackerProps {
  /** Pass a live count from your workflow (e.g. searches today). Defaults to 0. */
  activityCount?: number;
}

/**
 * Reference: progress milestones on the dashboard.
 * Thresholds and labels in dopamine.config.ts. Wire `activityCount` from workflow
 * state or an API when core-workflow is enabled.
 */
export function MilestoneTracker({ activityCount = 0 }: MilestoneTrackerProps) {
  const milestones = dopamineContent.milestones;
  const next = milestones.find((m) => activityCount < m.threshold) ?? milestones[milestones.length - 1];
  const progress = Math.min(100, (activityCount / next.threshold) * 100);

  return (
    <div className="flex flex-col gap-4 p-5 surface-inset border-border-dim/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-heading">Your progress</h3>
        <span className="text-xs text-text-muted">
          {activityCount} / {next.threshold}
        </span>
      </div>
      <div className="h-2 rounded-full bg-black/5 overflow-hidden">
        <div
          className="h-full bg-grad-brass transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ul className="flex flex-col gap-2">
        {milestones.map((m) => {
          const Icon = ICONS[m.icon] ?? Crown;
          const done = activityCount >= m.threshold;
          return (
            <li
              key={m.threshold}
              className={`flex items-start gap-3 text-xs ${done ? "text-success" : "text-text-muted"}`}
            >
              <Icon size={14} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{m.label}</p>
                {done && <p className="text-text-secondary mt-0.5">{m.reward}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
