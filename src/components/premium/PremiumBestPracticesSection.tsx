"use client";

import type { LucideIcon } from "lucide-react";
import { Lightbulb } from "lucide-react";

interface PracticeItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface PremiumBestPracticesSectionProps {
  title: string;
  subtitle?: string;
  items: PracticeItem[];
}

export function PremiumBestPracticesSection({
  title,
  subtitle,
  items,
}: PremiumBestPracticesSectionProps) {
  return (
    <section className="glass-card p-8">
      <div className="mb-6 flex items-start gap-3">
        <Lightbulb size={22} className="mt-0.5 shrink-0 text-brass-700" />
        <div>
          <h2 className="text-xl font-medium text-text-primary">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex gap-4 rounded-2xl border border-border-dim bg-page/60 p-5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700">
              <item.icon size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-text-primary">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
