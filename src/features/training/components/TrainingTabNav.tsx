"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, HelpCircle } from "lucide-react";
import { clsx } from "clsx";
import { trainingRoutes } from "@/config/training.config";

const tabs = [
  { href: trainingRoutes.videos, label: "Training Videos", icon: Play },
  { href: trainingRoutes.faq, label: "FAQ", icon: HelpCircle },
] as const;

export function TrainingTabNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 -mx-1 overflow-x-auto px-1 pb-1" aria-label="Training sections">
      <div className="flex min-w-max flex-wrap gap-2 sm:min-w-0 sm:flex-wrap">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.12em] transition-all",
              isActive
                ? "bg-grad-brass text-text-on-accent shadow-[0_0_20px_color-mix(in_srgb,var(--brand-primary)_25%,transparent)]"
                : "border border-border-dim/40 bg-surface/40 text-text-primary hover:border-[var(--mcv-line-brass)] hover:bg-brass-100"
            )}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
