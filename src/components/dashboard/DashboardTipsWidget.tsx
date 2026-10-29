"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { brand } from "@/config/brand.config";
import { DashboardSection } from "./DashboardSection";

const DEFAULT_TIPS = [
  {
    title: "Tip",
    body: "Complete onboarding and add your real support email before launch.",
  },
  {
    title: "Tip",
    body: "Enable only the features your product needs — keep the sidebar focused.",
  },
  {
    title: "Tip",
    body: "Replace placeholder partner URLs in offers.config.ts and promos.config.ts.",
  },
  {
    title: "Tip",
    body: `Add real Vimeo IDs in training.config.ts / dashboard.config.ts when ${brand.productName} videos are ready.`,
  },
];

interface DashboardTipsWidgetProps {
  tips?: { title: string; body: string }[];
}

export function DashboardTipsWidget({ tips = DEFAULT_TIPS }: DashboardTipsWidgetProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [tips.length]);

  const tip = tips[tipIndex];

  return (
    <DashboardSection className="min-w-0">
      <div className="flex items-center gap-3 border-b border-border-dim/60 pb-4">
        <div className="dashboard-section-icon">
          <Lightbulb size={18} />
        </div>
        <div className="min-w-0">
          <p className="ds-h4">{tip.title}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-text-muted">{tip.body}</p>
      <p className="mt-3 text-xs italic text-text-muted">Individual results vary.</p>
    </DashboardSection>
  );
}
