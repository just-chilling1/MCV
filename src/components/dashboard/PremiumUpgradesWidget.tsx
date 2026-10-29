"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { getPremiumFeatures } from "@/lib/features";
import { isNavPathActive } from "@/lib/nav-active";

type PremiumUpgradesWidgetProps = {
  onNavigate?: () => void;
  className?: string;
  variant?: "featured" | "sidebar";
  /** Sidebar nav only — dashboard right rail keeps descriptions (default true). */
  showDescriptions?: boolean;
};

export function PremiumUpgradesWidget({
  onNavigate,
  className,
  variant = "featured",
  showDescriptions = true,
}: PremiumUpgradesWidgetProps) {
  const pathname = usePathname();
  const premiumFeatures = getPremiumFeatures();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (premiumFeatures.length === 0) return null;

  if (!mounted) {
    return (
      <div
        className={clsx(
          "premium-upgrades-panel min-h-[10rem] animate-pulse rounded-xl bg-brass-100/40",
          variant === "sidebar" && "premium-upgrades-panel--sidebar min-w-0 w-full",
          className
        )}
        aria-hidden
      />
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={clsx("premium-upgrades-panel premium-upgrades-panel--sidebar min-w-0 w-full", className)}>
        <div className="premium-upgrades-sidebar-header">
          <p className="premium-upgrades-sidebar-label text-[13px]">
            <Sparkles className="h-3 w-3 shrink-0" fill="currentColor" />
            Premium Features
          </p>
          <p className="text-xs leading-relaxed text-text-secondary">
            Unlock the tools that drive the biggest results.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {premiumFeatures.map((feature) => {
            const isActive = isNavPathActive(pathname, feature.href);
            const Icon = feature.icon;

            return (
              <div key={feature.href}>
                <Link
                  href={feature.href}
                  onClick={onNavigate}
                  className={clsx(
                    "premium-upgrade-card premium-upgrade-card--sidebar group !min-h-0 flex-row items-center gap-2.5 !p-2.5",
                    isActive && "is-active"
                  )}
                >
                  <div
                    className={clsx(
                      "premium-upgrade-icon premium-upgrade-icon--sidebar flex shrink-0 items-center justify-center",
                      isActive && "bg-brass-100 text-brass-700"
                    )}
                  >
                    <Icon size={14} strokeWidth={1.5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={clsx(
                        "block text-xs tracking-wide text-text-heading",
                        isActive ? "font-medium" : "font-medium"
                      )}
                    >
                      {feature.label}
                    </span>
                    {showDescriptions ? (
                      <p className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-text-secondary">
                        {feature.description}
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 text-brass-700">
                    {isActive ? (
                      <span className="text-[13px] font-medium">Active</span>
                    ) : (
                      <ArrowRight
                        size={12}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    )}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("premium-upgrades-panel premium-upgrades-panel--featured", className)}>
      <div className="mb-4 text-center md:text-left">
        <p className="flex items-center justify-center gap-2 text-[13px] font-medium uppercase tracking-widest text-brass-700 md:justify-start">
          <Sparkles className="h-4 w-4 shrink-0 text-brass-700" fill="currentColor" />
          Premium Features
        </p>
        <p className="mx-auto mt-1.5 max-w-2xl text-sm leading-relaxed text-text-secondary md:mx-0">
          Unlock the tools that drive the biggest results.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
        {premiumFeatures.map((feature) => {
          const isActive = isNavPathActive(pathname, feature.href);
          const Icon = feature.icon;

          return (
            <div key={feature.href} className="min-w-0">
              <Link
                href={feature.href}
                onClick={onNavigate}
                className={clsx(
                  "premium-upgrade-card group flex h-full flex-col items-start gap-3 p-4",
                  isActive && "is-active"
                )}
              >
                <div className="flex w-full items-start gap-3">
                  <div
                    className={clsx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
                      isActive
                        ? "border-[var(--mcv-line-brass)] bg-grad-brass text-black shadow-brass"
                        : "border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700 group-hover:border-[var(--mcv-line-brass)] group-hover:bg-grad-brass group-hover:text-black group-hover:shadow-brass"
                    )}
                  >
                    <Icon size={19} strokeWidth={1.5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={clsx(
                        "block text-sm tracking-wide text-text-heading",
                        isActive ? "font-medium" : "font-medium"
                      )}
                    >
                      {feature.label}
                    </span>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-brass-700 transition-colors group-hover:text-brass-700">
                  {isActive ? (
                    "Active"
                  ) : (
                    <>
                      Explore
                      <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
