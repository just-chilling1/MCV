"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { clsx } from "clsx";
import type { FaqSection } from "@/config/faq.config";

interface SupportFaqAccordionProps {
  sections: FaqSection[];
}

export function SupportFaqAccordion({ sections }: SupportFaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {sections.map((section, si) => (
        <div key={section.title}>
          <h3 className="mb-1 px-1 text-[13px] font-medium uppercase tracking-wide text-brass-700 sm:px-2">
            {section.title}
          </h3>
          <div className="divide-y divide-border-dim/80">
            {section.items.map((faq, i) => {
              const id = `faq-${si}-${i}`;
              const isOpen = openId === id;

              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    className="flex w-full items-center justify-between rounded-md px-1 py-3 text-left transition-colors hover:bg-brass-100 sm:px-2"
                    onClick={() => setOpenId(isOpen ? null : id)}
                  >
                    <span className="pr-4 text-sm font-medium text-text-primary">{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={clsx(
                        "shrink-0 transition-transform duration-200",
                        isOpen ? "rotate-180 text-brass-700" : "text-text-muted"
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        id={id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-1 pb-4 text-sm leading-relaxed text-text-secondary sm:px-2">
                          {faq.a}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SupportFaqCardHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-border-dim/80 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100">
        <HelpCircle className="h-5 w-5 text-brass-700" />
      </div>
      <div>
        <h2 className="ds-h3">Frequently Asked Questions</h2>
        <p className="mt-1 text-sm text-text-muted">Quick answers before you send a message</p>
      </div>
    </div>
  );
}
