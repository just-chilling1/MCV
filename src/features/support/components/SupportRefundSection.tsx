"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { support } from "@/config/support.config";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function SupportRefundSection() {
  const { refundPolicy } = support;

  return (
    <motion.section variants={itemVariants} className="card-base">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100">
          <FileText className="h-6 w-6 text-brass-700" />
        </div>
        <div>
          <h2 className="ds-h3">{refundPolicy.title}</h2>
          <p className="mt-1 text-sm text-text-muted">{refundPolicy.subtitle}</p>
        </div>
      </div>

      <div className="space-y-4">
        {refundPolicy.items.map((item) => (
          <div key={item.title} className="rounded-xl border border-border-dim/80 bg-page/60 p-4">
            <h3 className="ds-h4 mb-2 text-brass-700">{item.title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{item.body}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

export { containerVariants, itemVariants };
