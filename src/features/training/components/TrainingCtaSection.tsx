"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trainingCta, getTrainingStartCta } from "@/lib/training-content";

export function TrainingCtaSection() {
  const startCta = getTrainingStartCta();
  const StartIcon = startCta.icon;

  return (
    <section className="glass-card overflow-hidden">
      <div className="border-b border-[var(--mcv-line-brass)] bg-brass-100 px-5 py-6 sm:px-8">
        <h2 className="text-lg font-medium text-text-heading">{trainingCta.headline}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          {trainingCta.subcopy}
        </p>
      </div>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:px-8">
        <Link href={startCta.href} className="btn-primary min-h-[48px] flex-1 text-sm sm:text-base">
          <StartIcon className="h-5 w-5 shrink-0" />
          {startCta.label}
        </Link>
        <Link href="/training/faq" className="btn-secondary min-h-[48px] shrink-0 px-6 text-sm">
          Browse FAQ
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
