"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Rocket } from "lucide-react";
import { DeploySitePreview } from "./DeploySitePreview";
import { GENERATION_RESULTS_ID } from "@/components/ui/generation-progress";
import type { BlogSite } from "../types";

interface DeployCompletePanelProps {
  site: BlogSite;
  productName?: string | null;
  onGenerateAnother: () => void;
  onViewVault: () => void;
}

export function DeployCompletePanel({
  site,
  productName,
  onGenerateAnother,
  onViewVault,
}: DeployCompletePanelProps) {
  return (
    <motion.div
      id={GENERATION_RESULTS_ID}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-w-0 max-w-full flex-col gap-5 scroll-mt-24 overflow-x-clip"
    >
      <div className="rounded-2xl border border-success/20 bg-brass-100 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/30">
            <CheckCircle2 className="shrink-0 text-success" size={24} />
          </div>
          <div className="min-w-0">
            <p className="brand-font text-lg text-text-heading sm:text-xl">
              {productName || site.title}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Published and ready to share. Visitors complete the quiz, then see your affiliate offer on the last page.
            </p>
          </div>
        </div>
      </div>

      <DeploySitePreview site={site} showLiveLink />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <motion.button
          type="button"
          onClick={onGenerateAnother}
          whileHover={{ scale: 1.01 }}
          className="w-full rounded-xl border border-border-dim bg-white px-4 py-4 text-base font-medium text-text-primary shadow-sm transition-colors hover:border-[var(--mcv-line-brass)] hover:bg-brass-100 hover:text-brass-700"
        >
          <span className="flex items-center justify-center gap-2">
            <Rocket size={18} />
            Generate Another Site
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={onViewVault}
          whileHover={{ scale: 1.01 }}
          className="w-full rounded-xl border border-border-dim bg-white px-4 py-4 text-base font-medium text-text-primary shadow-sm transition-colors hover:border-[var(--mcv-line-brass)] hover:bg-brass-100 hover:text-brass-700"
        >
          <span className="flex items-center justify-center gap-2">
            View offers library
            <ArrowRight size={18} />
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
