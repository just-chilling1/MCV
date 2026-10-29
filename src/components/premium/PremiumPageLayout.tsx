"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/page-header";

interface PremiumPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  className?: string;
  animate?: boolean;
}

export function PremiumPageLayout({
  title,
  subtitle,
  children,
  footer,
  actions,
  className,
  animate = true,
}: PremiumPageLayoutProps) {
  const content = (
    <div className={clsx("page-container", className)}>
      <PageHeader eyebrow="Premium" title={title} subtitle={subtitle} actions={actions} />
      {children}
      {footer}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {content}
    </motion.div>
  );
}
