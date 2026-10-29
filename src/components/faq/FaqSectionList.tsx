"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { FaqSection } from "@/config/faq.config";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border-dim/20">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors duration-200 hover:bg-brass-100"
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={15} className="shrink-0 text-brass-700" />
          <span className="text-sm font-medium text-text-primary">{q}</span>
        </div>
        {open ? (
          <ChevronUp size={14} className="shrink-0 text-text-muted" />
        ) : (
          <ChevronDown size={14} className="shrink-0 text-text-muted" />
        )}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-12">
              <p className="text-[13px] leading-relaxed text-text-secondary">{a}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

interface FaqSectionListProps {
  sections: FaqSection[];
  showCount?: boolean;
}

export function FaqSectionList({ sections, showCount = true }: FaqSectionListProps) {
  const faqCount = sections.reduce((acc, section) => acc + section.items.length, 0);

  return (
    <div className="flex flex-col gap-3">
      {showCount ? (
        <div className="flex items-center gap-2 px-1">
          <HelpCircle size={16} className="text-brass-700" />
          <span className="text-[13px] font-medium uppercase tracking-widest text-text-muted">
            {faqCount} answers
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h3 className="mb-1 px-1 text-[13px] font-medium uppercase tracking-[0.15em] text-brass-700">
              {section.title}
            </h3>
            {section.items.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
