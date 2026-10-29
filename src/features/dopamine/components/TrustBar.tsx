"use client";

import { Shield, Headphones, Star } from "lucide-react";
import { dopamineContent } from "@/config/dopamine.config";

const ICONS = { Shield, Headphones, Star } as const;

/**
 * Reference: horizontal trust / credibility strip for dashboard or landing sections.
 * Copy and stats live in dopamine.config.ts — rebrand per product.
 */
export function TrustBar() {
  const { items } = dopamineContent.trustBar;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 py-4 px-2 surface-inset border-border-dim/30">
      {items.map((item) => {
        const Icon = ICONS[item.icon as keyof typeof ICONS] ?? Star;
        return (
          <div key={item.label} className="flex items-center gap-2 text-text-secondary text-[13px] font-medium">
            <Icon size={14} className="text-brass-700 shrink-0" />
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
