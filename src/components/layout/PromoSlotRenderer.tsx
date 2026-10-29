"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { PromoSlot } from "@/config/promos.config";
import { getNavIcon } from "@/lib/nav-icons";
import { brand } from "@/config/brand.config";

interface PromoSlotRendererProps {
  slot: PromoSlot;
  onClose?: () => void;
}

export function PromoSlotRenderer({ slot, onClose }: PromoSlotRendererProps) {
  const { template, content } = slot;
  const Icon = content.icon ? getNavIcon(content.icon) : null;
  const bodies = Array.isArray(content.body) ? content.body : content.body ? [content.body] : [];

  if (template === "horizontal-banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full pt-2 sm:pt-4 pb-4 -mt-2 sm:-mt-4 group mb-4 sm:mb-6"
      >
        <div
          className="relative overflow-hidden rounded-xl p-4 sm:p-6 lg:p-7 shadow-lg"
          style={{ backgroundColor: brand.colors.promoAccent }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10 w-full max-w-5xl">
            {Icon && (
              <div className="hidden md:flex relative shrink-0">
                <Icon size={56} className="text-white" strokeWidth={1.5} />
              </div>
            )}
            <div className="flex flex-col gap-3 flex-1">
              <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
                {content.headline}
              </h2>
              {bodies.length > 0 && (
                <div className="text-white/95 text-[15px] space-y-1.5 leading-relaxed font-medium">
                  {bodies.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
              {content.ctaLabel && content.ctaUrl && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => window.open(content.ctaUrl, "_blank")}
                    className="cursor-pointer font-medium px-4 sm:px-6 py-2.5 rounded-md shadow-sm text-sm sm:text-[15px] w-full sm:w-auto transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-[0.98] text-white"
                    style={{ backgroundColor: brand.colors.promoCta }}
                  >
                    {content.ctaLabel}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (template === "footer-card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col gap-4 px-4 sm:px-6 py-4 sm:py-5 rounded-[14px] border border-border-dim glass-card transition-all duration-300 w-full mt-6 sm:mt-8 shrink-0"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            {Icon && (
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 border border-[var(--mcv-line-brass)] bg-brass-100">
                <Icon size={24} strokeWidth={1.5} className="text-brass-700" />
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[17px] font-medium text-text-heading tracking-tight">
                {content.title ?? content.headline}
              </h3>
              {content.subtitle && (
                <p className="text-text-muted text-[14px]">{content.subtitle}</p>
              )}
            </div>
          </div>
          {content.ctaLabel && content.ctaUrl && (
            <a
              href={content.ctaUrl}
              className="bg-grad-brass hover:brightness-105 transition-colors rounded-full h-[42px] px-6 sm:px-7 w-full sm:w-auto text-white font-medium text-[14px] flex items-center justify-center shrink-0"
            >
              {content.ctaLabel}
            </a>
          )}
        </div>
        {content.stats && content.stats.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border-dim">
            {content.stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[13px] text-text-muted">
                <span>
                  {stat.text}
                  {stat.highlight && (
                    <>
                      {" "}
                      <strong className="text-success">{stat.highlight}</strong>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  if (template === "sidebar-card") {
    return (
      <a
        href={content.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-page border border-[var(--mcv-line-brass)] hover:border-[var(--mcv-line-brass)] transition-all duration-300 group"
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="brand-font text-[13px] font-medium text-brass-700 leading-tight">
            {content.headline}
          </span>
          <span className="text-[13px] text-text-muted font-medium">
            {content.sidebarSubtitle ?? "Claim Now"}
          </span>
        </div>
        <div className="w-8 h-8 rounded-lg border border-[var(--mcv-line-brass)] flex items-center justify-center shrink-0 group-hover:bg-brass-100 transition-colors">
          <ExternalLink size={14} className="text-brass-700" />
        </div>
      </a>
    );
  }

  if (template === "modal") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--mcv-line-strong)] bg-raised p-5 sm:p-8 shadow-2xl safe-bottom"
          onClick={(e) => e.stopPropagation()}
        >
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-text-muted cursor-pointer transition-all duration-200 hover:bg-brass-100 hover:text-text-heading"
              aria-label="Close"
            >
              ×
            </button>
          )}
          {content.badge && (
            <span className="text-[13px] font-medium text-brass-700 uppercase tracking-widest">
              {content.badge}
            </span>
          )}
          <h2 className="text-2xl font-medium text-text-heading mt-2">{content.headline}</h2>
          {bodies[0] && <p className="text-text-secondary mt-2">{bodies[0]}</p>}
          {content.bullets && (
            <ul className="mt-4 space-y-2">
              {content.bullets.map((b, i) => (
                <li key={i} className="text-sm text-text-secondary flex gap-2">
                  <span className="text-brass-700">✓</span> {b}
                </li>
              ))}
            </ul>
          )}
          {content.scarcity && (
            <div className="mt-4 text-xs text-text-muted">
              {content.scarcity.current}/{content.scarcity.total} {content.scarcity.label}
            </div>
          )}
          {content.ctaLabel && content.ctaUrl && (
            <button
              type="button"
              onClick={() => {
                window.open(content.ctaUrl, "_blank");
                onClose?.();
              }}
              className="btn-primary w-full mt-6"
            >
              {content.ctaLabel}
            </button>
          )}
        </motion.div>
      </motion.div>
    );
  }

  if (template === "toast") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:left-6 sm:bottom-6 z-50 sm:max-w-sm rounded-xl border border-[var(--mcv-line-strong)] bg-raised p-4 shadow-xl safe-bottom"
      >
        <p className="text-sm font-medium text-text-heading">{content.headline}</p>
        <p className="text-xs text-text-muted mt-1">
          {content.toastMessage}{" "}
          {content.toastAmount && (
            <span className="text-success font-medium">{content.toastAmount}</span>
          )}
        </p>
        {content.ctaLabel && content.ctaUrl && (
          <button
            type="button"
            onClick={() => window.open(content.ctaUrl, "_blank")}
            className="text-xs text-brass-700 font-medium mt-2 cursor-pointer transition-colors hover:text-brass-900 hover:underline"
          >
            {content.ctaLabel}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-text-muted text-xs cursor-pointer transition-all duration-200 hover:bg-brass-100 hover:text-text-heading"
          >
            ×
          </button>
        )}
      </motion.div>
    );
  }

  return null;
}
