"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { clsx } from "clsx";

interface PremiumControlCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PremiumControlCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
  className,
}: PremiumControlCardProps) {
  return (
    <section className={clsx("glass-card overflow-hidden p-0", className)}>
      <div className="border-b border-divider bg-brass-100 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brass-100 text-brass-700">
              <Icon size={24} />
            </div>
            <div>
              <p className="font-medium text-text-primary">{title}</p>
              <p className="text-sm text-text-secondary">{description}</p>
            </div>
          </div>
          {badge}
        </div>
      </div>
      <div className="space-y-3 p-5 md:p-6">{children}</div>
    </section>
  );
}
