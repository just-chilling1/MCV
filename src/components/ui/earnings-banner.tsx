"use client";

import { useState } from "react";
import { CirclePlay, Sparkles, X } from "lucide-react";
import { clsx } from "clsx";
import { trainingContent } from "@/config/training.config";

interface EarningsBannerProps {
  onDismiss?: () => void;
  compact?: boolean;
  /** High-visibility styling for use during AI generation */
  prominent?: boolean;
}

export function EarningsBanner({
  onDismiss,
  compact = false,
  prominent = false,
}: EarningsBannerProps) {
  const [visible, setVisible] = useState(true);
  const ctaUrl = trainingContent.externalTrainingUrl;

  if (!visible || !ctaUrl) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const isLarge = prominent || !compact;

  if (prominent) {
    return (
      <section className="dashboard-bonus-ad" aria-label="Free training offer">
        <div className="dashboard-bonus-ad-shimmer" aria-hidden />

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss offer"
          className="absolute top-3 right-3 z-[3] flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/10 hover:text-text-heading"
        >
          <X size={16} />
        </button>

        <div className="dashboard-bonus-ad-inner">
          <p className="dashboard-bonus-ad-badge">
            <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={1.75} aria-hidden />
            Free Training
          </p>

          <h3
            className="mx-auto max-w-3xl text-xl font-medium uppercase leading-tight tracking-tight text-ink sm:text-2xl md:text-[1.75rem]"
            style={{ fontFamily: "var(--font-brand)" }}
          >
            Wake Up With An Extra{" "}
            <span className="dashboard-bonus-ad-amount">$1,000–$5,000</span> In Your Bank Account
            Tomorrow
          </h3>

          <p className="dashboard-bonus-ad-closing mx-auto mt-4 max-w-2xl">
            Discover how to scale to $1,000–$5,000 every single day — without doing any extra work.
          </p>

          <div className="dashboard-bonus-ad-cta-wrap">
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="dashboard-bonus-ad-cta"
            >
              <span className="dashboard-bonus-ad-cta-shine" aria-hidden />
              <span className="relative z-[1] inline-flex items-center justify-center gap-2.5 uppercase tracking-wide">
                <CirclePlay className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                Watch The Free Training {">>"}
              </span>
            </a>
            <p className="dashboard-bonus-ad-urgency uppercase tracking-wider">
              Warning: This Will Be Taken Down Soon
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      className={clsx(
        "relative w-full rounded-lg border border-[var(--mcv-line-brass)] bg-grad-tint text-center shadow-card transition-[border-color,box-shadow] duration-[160ms]",
        isLarge ? "p-5 sm:p-6" : "p-3 sm:p-3.5"
      )}
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss offer"
        className={clsx(
          "absolute flex items-center justify-center rounded-full text-text-muted transition-colors hover:bg-border-dim/50 hover:text-text-heading",
          isLarge ? "top-3 right-3 h-9 w-9" : "top-2 right-2 h-7 w-7"
        )}
      >
        <X size={isLarge ? 16 : 14} />
      </button>

      <span
        className={clsx(
          "inline-block rounded-full bg-raised font-medium tracking-[0.08em] text-ink",
          isLarge ? "mb-3 px-3 py-1 text-[13px]" : "mb-2 px-2 py-0.5 text-[13px]"
        )}
      >
        Free Training
      </span>

      <h3
        className={clsx(
          "font-medium uppercase leading-tight text-text-heading",
          isLarge ? "mb-2 text-xl sm:text-2xl" : "mb-1.5 text-sm sm:text-base"
        )}
      >
        Multiply Your Earnings To{" "}
        <span className="text-brass-700">$1,000 – $5,000</span> A Day
      </h3>

      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          "inline-flex w-full items-center justify-center gap-2 rounded-full bg-grad-brass font-medium tracking-normal text-brass-900 shadow-brass transition-[background,box-shadow] duration-[160ms] hover:brightness-[1.03] sm:w-auto",
          isLarge ? "min-h-[48px] px-8 py-3 text-sm" : "min-h-[40px] px-5 py-2 text-[13px]"
        )}
      >
        Click Here To Learn How
      </a>
    </div>
  );
}

export default EarningsBanner;
