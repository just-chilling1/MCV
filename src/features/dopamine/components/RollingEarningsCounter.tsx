"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { dopamineContent } from "@/config/dopamine.config";

/**
 * Reference: animated counter for session / activity metrics.
 * Not real earnings — configure label and increments in dopamine.config.ts.
 * Enable social-proof responsibly; keep copy honest for your product.
 */
export function RollingEarningsCounter() {
  const { earningsCounter } = dopamineContent;
  const [value, setValue] = useState<number>(earningsCounter.startValue);

  useEffect(() => {
    const timer = setInterval(() => {
      const delta =
        earningsCounter.incrementMin +
        Math.random() * (earningsCounter.incrementMax - earningsCounter.incrementMin);
      setValue((v) => Math.round((v + delta) * 100) / 100);
    }, earningsCounter.intervalMs);
    return () => clearInterval(timer);
  }, [earningsCounter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-4 rounded-xl border border-success/20 bg-success/10"
    >
      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
        <TrendingUp size={18} className="text-success" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-text-muted uppercase tracking-widest">
          {earningsCounter.label}
        </p>
        <p className="text-xl font-medium text-success tabular-nums">{value}</p>
      </div>
    </motion.div>
  );
}
