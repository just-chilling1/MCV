"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import { GenerationProgress, GENERATION_RESULTS_ID } from "@/components/ui/generation-progress";

interface SuggestionGridProps {
  suggestions: string[];
  selected: string;
  onSelect: (s: string) => void;
  loading?: boolean;
}

export function SuggestionGrid({
  suggestions,
  selected,
  onSelect,
  loading,
}: SuggestionGridProps) {
  if (loading) {
    return (
      <div className="glass-card p-6 flex flex-col gap-4">
        <GenerationProgress
          active
          label="Finding good topics for you..."
        />
        <p className="text-sm text-text-muted text-center">
          This can take 10–30 seconds. Hang tight.
        </p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-2">
        Topic ideas will appear here after you press the Suggest button.
      </p>
    );
  }

  return (
    <div id={GENERATION_RESULTS_ID} className="grid grid-cols-1 sm:grid-cols-2 gap-3 scroll-mt-24">
      {suggestions.map((s) => (
        <motion.button
          key={s}
          type="button"
          whileHover={{ scale: 1.01 }}
          onClick={() => onSelect(s)}
          className={clsx("select-card p-4", selected === s && "is-selected")}
        >
          <span className={clsx("select-card-label block", selected === s && "font-medium text-brass-700")}>
            {s}
          </span>
          {selected === s && (
            <span className="select-check-badge select-check-badge--corner" aria-hidden>
              <Check size={18} strokeWidth={3} />
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
}
