"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Globe, Loader2, Rocket, Sparkles } from "lucide-react";
import { AiLoadingBar } from "@/components/ui/AiLoadingBar";
import { cn } from "@/lib/utils";
import { useBlogBuilder } from "../context/BlogBuilderContext";

export type DeployLoaderPhase = "setup" | "generating" | "publishing";

const PHASES: { id: DeployLoaderPhase; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "generating", label: "Build" },
  { id: "publishing", label: "Launch" },
];

const PHASE_INDEX: Record<DeployLoaderPhase, number> = {
  setup: 0,
  generating: 1,
  publishing: 2,
};

const PHASE_MESSAGES: Record<DeployLoaderPhase, string> = {
  setup: "Creating your questionnaire site record…",
  generating: "Writing quiz questions and building pages…",
  publishing: "Publishing your site to the web…",
};

const SKELETON_CAPTIONS: Record<DeployLoaderPhase, string> = {
  setup: "Preparing template…",
  generating: "Generating questionnaire preview…",
  publishing: "Building landing page…",
};

const PHASE_TICKERS: Record<DeployLoaderPhase, string[]> = {
  setup: [
    "Reserving your site slug…",
    "Linking affiliate URLs…",
    "Scanning offer page for context…",
    "Applying your theme preset…",
  ],
  generating: [
    "Drafting niche quiz questions…",
    "Building intro and results pages…",
    "Placing affiliate offer on final page…",
    "Assembling themed layout…",
    "Polishing call-to-action copy…",
  ],
  publishing: [
    "Finalizing page assets…",
    "Marking site as live…",
    "Syncing your dashboard…",
  ],
};

/** Progress ceiling per phase — bar eases toward these while work runs. */
const PHASE_PROGRESS: Record<DeployLoaderPhase, { start: number; cap: number }> = {
  setup: { start: 8, cap: 32 },
  generating: { start: 32, cap: 88 },
  publishing: { start: 88, cap: 99 },
};

const PHASE_ETA_SECONDS: Record<DeployLoaderPhase, number> = {
  setup: 35,
  generating: 90,
  publishing: 20,
};

const SKELETON_BLOCKS = [
  { className: "h-14 w-full" },
  { className: "h-3 w-2/3" },
  { className: "h-10" },
  { className: "h-10" },
  { className: "h-10" },
  { className: "h-8 w-1/2 mx-auto" },
] as const;

interface DeploySiteLoaderProps {
  phase?: DeployLoaderPhase;
  className?: string;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 pl-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="deploy-typing-dot inline-block h-1 w-1 rounded-full bg-brass-1000"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

function formatEta(seconds: number): string {
  if (seconds <= 5) return "Almost done";
  if (seconds < 60) return `~${seconds}s left`;
  const mins = Math.ceil(seconds / 60);
  return mins === 1 ? "~1 min left" : `~${mins} min left`;
}

function BrowserChrome() {
  return (
    <div className="mb-3 flex items-center gap-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="deploy-browser-dot h-2 w-2 rounded-full bg-black/10"
          style={{ animationDelay: `${i * 0.22}s` }}
        />
      ))}
      <div className="relative ml-2 h-2 max-w-[140px] flex-1 overflow-hidden rounded-full bg-brass-100">
        <span className="deploy-url-shimmer absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-brass-300/40 to-transparent" />
      </div>
    </div>
  );
}

function SkeletonBlock({ index, className, visible }: { index: number; className: string; visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{
        opacity: visible ? 1 : 0.15,
        y: 0,
        scale: 1,
      }}
      transition={{ delay: index * 0.12, duration: 0.45, ease: "easeOut" }}
      className={cn(
        "deploy-block relative overflow-hidden rounded-md border border-divider",
        "bg-gradient-to-r from-brass-100 via-brass-100 to-transparent",
        className,
        visible && "deploy-block--live"
      )}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <span
        className="deploy-block-shimmer pointer-events-none absolute inset-0"
        style={{ animationDelay: `${index * 0.2}s` }}
        aria-hidden
      />
    </motion.div>
  );
}

function SkeletonPreview({ phase }: { phase: DeployLoaderPhase }) {
  const visibleBlocks =
    phase === "setup" ? 2 : phase === "generating" ? 5 : SKELETON_BLOCKS.length;

  return (
    <div className="relative space-y-2.5">
      <SkeletonBlock index={0} className={SKELETON_BLOCKS[0].className} visible={0 < visibleBlocks} />
      <SkeletonBlock index={1} className={SKELETON_BLOCKS[1].className} visible={1 < visibleBlocks} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2">
        <SkeletonBlock index={2} className={SKELETON_BLOCKS[2].className} visible={2 < visibleBlocks} />
        <SkeletonBlock index={3} className={SKELETON_BLOCKS[3].className} visible={3 < visibleBlocks} />
        <SkeletonBlock index={4} className={SKELETON_BLOCKS[4].className} visible={4 < visibleBlocks} />
      </div>
      <SkeletonBlock index={5} className={SKELETON_BLOCKS[5].className} visible={5 < visibleBlocks} />

      <div
        className="deploy-scan pointer-events-none absolute inset-x-0 top-2 h-px bg-gradient-to-r from-transparent via-brass-300 to-brass-500 opacity-90 shadow-brass"
        aria-hidden
      />
      <div
        className="deploy-scan-glow pointer-events-none absolute inset-x-0 top-2 h-8 bg-gradient-to-b from-brass-100 to-transparent"
        aria-hidden
      />
    </div>
  );
}

function DeploySiteLoaderInner({ phase = "generating", className }: DeploySiteLoaderProps) {
  const { generationLog } = useBlogBuilder();
  const activeIndex = PHASE_INDEX[phase];
  const [tickerIndex, setTickerIndex] = useState(0);
  const [progress, setProgress] = useState(PHASE_PROGRESS[phase].start);
  const [elapsedSec, setElapsedSec] = useState(0);

  const latestLog = generationLog.length > 0 ? generationLog[generationLog.length - 1] : null;
  const completedLogs = generationLog.slice(0, -1).slice(-3);

  const displayMessage = latestLog ?? PHASE_MESSAGES[phase];
  const tickerMessage = PHASE_TICKERS[phase][tickerIndex % PHASE_TICKERS[phase].length];
  const skeletonCaption = SKELETON_CAPTIONS[phase];

  const progressLabel = useMemo(() => {
    if (phase === "publishing") return "Going live";
    if (phase === "generating") return "AI building your questionnaire";
    return "Preparing site";
  }, [phase]);

  const etaLabel = useMemo(() => {
    const total = PHASE_ETA_SECONDS[phase];
    const { start, cap } = PHASE_PROGRESS[phase];
    const phaseSpan = cap - start;
    const phaseProgress = phaseSpan > 0 ? (progress - start) / phaseSpan : 1;
    const remaining = Math.max(0, Math.round(total * (1 - phaseProgress) - elapsedSec * 0.15));
    return formatEta(remaining);
  }, [phase, progress, elapsedSec]);

  useEffect(() => {
    setProgress(PHASE_PROGRESS[phase].start);
    setElapsedSec(0);
  }, [phase]);

  useEffect(() => {
    const { cap } = PHASE_PROGRESS[phase];
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= cap) return p;
        const step = phase === "generating" ? 0.35 : 0.55;
        return Math.min(cap, p + step);
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const id = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTickerIndex((i) => i + 1);
    }, 2800);
    return () => window.clearInterval(id);
  }, [phase]);

  const roundedProgress = Math.round(progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "deploy-site-loader glass-card overflow-hidden border-border-dim/60 p-4 sm:p-6 contain-paint",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <motion.div
            className="deploy-rocket-wrap flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100"
            aria-hidden
          >
            <Rocket size={18} className="text-brass-700" />
          </motion.div>
          <div className="min-w-0 space-y-2">
            <p className="flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.16em] text-brass-700">
              <Sparkles size={11} className="deploy-sparkle shrink-0" aria-hidden />
              Site Assembly
            </p>
            <div className="rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 px-3 py-2.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayMessage}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-2"
                >
                  <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-brass-700" aria-hidden />
                  <p className="text-sm font-medium leading-snug text-text-primary sm:text-base">
                    {displayMessage}
                    {!latestLog && <TypingDots />}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        <Globe size={18} className="deploy-globe shrink-0 text-text-muted/60" aria-hidden />
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border-dim bg-page/80 p-3 sm:p-4">
        <BrowserChrome />
        <SkeletonPreview phase={phase} />
        <p className="mt-3 flex items-center justify-center gap-2 text-center text-[13px] font-medium text-text-secondary">
          <Loader2 size={12} className="animate-spin text-brass-700" aria-hidden />
          {skeletonCaption}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={`${phase}-${tickerMessage}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.3 }}
          className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--mcv-line-brass)] bg-brass-100 px-3 py-2 text-[13px] font-medium text-text-primary"
        >
          <span className="deploy-activity-pulse h-2 w-2 shrink-0 rounded-full bg-grad-brass" aria-hidden />
          <span className="truncate">{tickerMessage}</span>
        </motion.p>
      </AnimatePresence>

      {completedLogs.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-divider pt-2" aria-label="Completed steps">
          {completedLogs.map((line, i) => (
            <motion.li
              key={`${line}-${i}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 0.65, height: "auto" }}
              className="flex items-center gap-2 truncate text-[13px] text-text-muted"
            >
              <Check size={12} className="shrink-0 text-brass-700" aria-hidden />
              <span className="line-through decoration-text-muted/40">{line}</span>
            </motion.li>
          ))}
        </ul>
      )}

      <div className="mt-5 space-y-3">
        <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Deployment progress">
          {PHASES.map((step, index) => {
            const isActive = index === activeIndex;
            const isDone = index < activeIndex;

            return (
              <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                <motion.span
                  layout
                  animate={
                    isActive
                      ? { scale: [1, 1.06, 1], boxShadow: "var(--mcv-shadow-brass)" }
                      : { scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" }
                  }
                  transition={isActive ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full font-medium transition-colors duration-300",
                    isDone && "h-7 w-7 bg-grad-brass text-text-on-accent text-[13px]",
                    isActive && "h-9 w-9 bg-grad-brass text-text-on-accent text-sm ring-2 ring-[var(--mcv-line-brass)] ring-offset-2 ring-offset-surface",
                    !isDone && !isActive && "h-7 w-7 border border-border-dim bg-brass-100 text-[13px] text-text-muted/70"
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isDone ? <Check size={14} strokeWidth={3} aria-hidden /> : index + 1}
                </motion.span>
                <span
                  className={cn(
                    "hidden truncate uppercase tracking-wider sm:inline",
                    isActive ? "text-sm font-medium text-text-primary" : isDone ? "text-[13px] font-medium text-brass-700" : "text-[13px] font-medium text-text-muted/60"
                  )}
                >
                  {step.label}
                </span>
                {index < PHASES.length - 1 && (
                  <span className="relative hidden h-0.5 flex-1 overflow-hidden rounded-full sm:block" aria-hidden>
                    <span className="absolute inset-0 bg-black/[0.06]" />
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full bg-grad-brass"
                      initial={{ width: "0%" }}
                      animate={{ width: isDone ? "100%" : isActive ? "55%" : "0%" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <AiLoadingBar
          label={progressLabel}
          progress={roundedProgress}
          eta={etaLabel}
          active
        />
      </div>
    </motion.div>
  );
}

export const DeploySiteLoader = memo(DeploySiteLoaderInner);
