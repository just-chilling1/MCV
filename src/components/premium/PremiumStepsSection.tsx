"use client";

import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

interface PremiumStep {
  num: string;
  title: string;
  desc: string;
  icon?: LucideIcon;
}

interface PremiumStepsSectionProps {
  title?: string;
  steps: PremiumStep[];
}

export function PremiumStepsSection({
  title = "How to Use This (3 Simple Steps)",
  steps,
}: PremiumStepsSectionProps) {
  return (
    <section className="glass-card p-8">
      <div className="mb-8 flex items-center gap-3">
        <CheckCircle2 size={22} className="text-brass-700" />
        <h2 className="text-xl font-medium text-text-primary">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.num}
            className="flex flex-col gap-4 rounded-2xl border border-[var(--mcv-line-brass)] bg-brass-100 p-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass-500 text-sm font-medium text-white shadow-[var(--mcv-shadow-brass)]">
              {step.num}
            </div>
            <h3 className="text-lg font-medium text-text-primary">{step.title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
