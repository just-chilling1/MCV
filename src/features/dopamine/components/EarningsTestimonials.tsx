"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { dopamineContent } from "@/config/dopamine.config";

/**
 * Reference: rotating member testimonial cards for dashboard upsell zones.
 * Replace quotes in dopamine.config.ts per product — use real testimonials only in production.
 */
export function EarningsTestimonials() {
  const items = [...dopamineContent.testimonials];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[index];

  return (
    <div className="relative surface-inset border-border-dim/30 p-5 overflow-hidden">
      <Quote size={20} className="text-ink-6 mb-3" />
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          className="flex flex-col gap-3 min-h-[100px]"
        >
          <p className="text-sm text-text-secondary leading-relaxed italic">&ldquo;{current.quote}&rdquo;</p>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-text-primary">
              {current.name} · {current.location}
            </span>
            {current.amount !== "$0" && (
              <span className="text-success font-medium">{current.amount}</span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      {items.length > 1 && (
        <div className="flex gap-2 mt-4 justify-end">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
            className="p-1.5 rounded-lg border border-border-dim text-text-muted hover:text-text-heading"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => setIndex((i) => (i + 1) % items.length)}
            className="p-1.5 rounded-lg border border-border-dim text-text-muted hover:text-text-heading"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
