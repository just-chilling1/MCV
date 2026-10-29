"use client";

import { HelpCircle } from "lucide-react";
import { faqPageCopy, faqSections } from "@/config/faq.config";
import { FaqSectionList } from "@/components/faq/FaqSectionList";
import { TrainingPageLayout } from "../components/TrainingPageLayout";

export default function TrainingFaqPage() {
  return (
    <TrainingPageLayout>
      <section className="flex flex-col gap-6">
        <div className="glass-card flex items-center gap-3 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[var(--mcv-line-brass)] bg-brass-100">
            <HelpCircle size={22} className="text-brass-700" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-text-heading">{faqPageCopy.title}</h2>
            <p className="text-sm text-text-muted">{faqPageCopy.subtitle}</p>
          </div>
        </div>

        <FaqSectionList sections={faqSections} />
      </section>
    </TrainingPageLayout>
  );
}
