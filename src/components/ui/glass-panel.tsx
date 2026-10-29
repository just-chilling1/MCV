import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  intensity?: "low" | "medium" | "high";
}

export function GlassPanel({
  children,
  className,
  contentClassName,
  intensity = "medium",
}: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "glass-panel rounded-2xl relative overflow-hidden",
        "border-border-dim shadow-sm",
        intensity === "low" && "backdrop-blur-sm",
        intensity === "medium" && "backdrop-blur-md",
        intensity === "high" && "backdrop-blur-xl",
        className
      )}
    >
      <div className="absolute inset-0 bg-linear-to-br from-brass-100/40 to-transparent pointer-events-none" />
      <div className={cn("relative z-10 h-full min-h-0", contentClassName)}>{children}</div>
    </motion.div>
  );
}
