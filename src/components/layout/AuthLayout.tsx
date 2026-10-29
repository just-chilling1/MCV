"use client";

import { motion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";
import { FloatingSupportButton } from "@/components/support/FloatingSupportButton";

interface AuthLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
}

export function AuthLayout({ children, subtitle }: AuthLayoutProps) {
  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-page"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-5 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col items-center gap-3 text-center w-full">
            <BrandLogo size="lg" showTagline={false} stacked className="w-full" />
            {subtitle && <p className="text-[15px] text-ink-3">{subtitle}</p>}
          </div>
          {children}
        </div>
      </motion.div>
      <FloatingSupportButton />
    </div>
  );
}
