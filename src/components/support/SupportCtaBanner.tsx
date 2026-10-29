"use client";

import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";
import { clsx } from "clsx";
import { support, supportRoutes } from "@/config/support.config";

interface SupportCtaBannerProps {
  className?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  href?: string;
}

export function SupportCtaBanner({
  className,
  title = "Need help with your account?",
  description = "Our support team is here if something looks off.",
  ctaLabel = support.ctaLabel,
  href = supportRoutes.contact,
}: SupportCtaBannerProps) {
  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-border-dim bg-white shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700">
            <Headphones size={20} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-medium text-text-heading">{title}</h3>
            <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{description}</p>
          </div>
        </div>

        <Link
          href={href}
          className="btn-secondary w-full shrink-0 text-sm px-5 sm:w-auto border-silver-500 bg-silver-700 text-canvas hover:border-silver-700 hover:bg-[var(--mcv-silver-hover)] hover:text-canvas"
        >
          {ctaLabel}
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
