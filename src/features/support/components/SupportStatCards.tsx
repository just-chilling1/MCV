"use client";

import { Clock, Shield, Star } from "lucide-react";
import { clsx } from "clsx";
import { support } from "@/config/support.config";

const STAT_ICONS = {
  clock: Clock,
  star: Star,
  shield: Shield,
} as const;

export function SupportStatCards() {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {support.stats.map((stat, index) => {
        const Icon = STAT_ICONS[stat.icon as keyof typeof STAT_ICONS] ?? Star;
        const isPrimary = index === 0;

        return (
          <li
            key={stat.label}
            className={clsx(
              "flex items-start gap-3 rounded-xl border p-4 text-sm transition-colors",
              isPrimary
                ? "border-[var(--mcv-line-brass)] bg-brass-100 ring-1 ring-brass-100 text-text-primary"
                : "border-border-dim bg-page/60 text-text-secondary"
            )}
          >
            <div
              className={clsx(
                "flex shrink-0 items-center justify-center rounded-lg",
                isPrimary ? "h-10 w-10 bg-brass-100" : "h-9 w-9 bg-brass-100"
              )}
            >
              <Icon
                size={isPrimary ? 20 : 17}
                className={clsx(isPrimary ? "text-brass-700" : "text-text-muted")}
              />
            </div>
            <span className={clsx("min-w-0 leading-snug", isPrimary && "font-medium")}>
              {isPrimary ? (
                <>
                  <span className="mb-0.5 block text-[13px] font-medium uppercase tracking-wide text-text-muted">
                    {stat.label}
                  </span>
                  {"highlight" in stat && stat.highlight ? (
                    <span className={clsx("text-base font-medium", stat.highlightClass ?? "text-success")}>
                      {stat.highlight}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="font-medium text-text-primary">{stat.label}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
