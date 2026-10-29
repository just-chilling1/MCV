"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clipboard,
  Clock,
  Copy,
  ExternalLink,
  ListChecks,
  Users,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import type { TrafficSource } from "@/features/premium-autopilot/lib/source-types";
import {
  SourceDifficultyBadge,
  SourceTypeBadge,
} from "@/features/premium-autopilot/components/SourceBadges";

interface SourceInstructionsOverlayProps {
  source: TrafficSource | null;
  isDone: boolean;
  copied: boolean;
  onClose: () => void;
  onToggleComplete: () => void;
  onCopyDescription: () => void;
  renderCopy: (template: string) => string;
}

export function SourceInstructionsOverlay({
  source,
  isDone,
  copied,
  onClose,
  onToggleComplete,
  onCopyDescription,
  renderCopy,
}: SourceInstructionsOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!source) return;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.focus();
    });
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(frame);
    };
  }, [source, handleKeyDown]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {source && (
        <motion.div
          key={source.id}
          className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="autopilot-source-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Close instructions"
            className="absolute inset-0 bg-canvas/80 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="relative z-10 flex max-h-[100dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border-dim bg-surface shadow-2xl outline-none sm:max-h-[min(88dvh,40rem)] sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 border-b border-border-dim bg-field px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                    <SourceTypeBadge type={source.type} />
                    <SourceDifficultyBadge difficulty={source.difficulty} />
                    {isDone && (
                      <span className="rounded-md border border-[var(--mcv-line-brass)] bg-brass-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-success">
                        Done
                      </span>
                    )}
                  </div>
                  <h2
                    id="autopilot-source-title"
                    className="brand-font text-2xl leading-tight text-text-heading sm:text-[1.75rem]"
                  >
                    {source.name}
                  </h2>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} className="text-success" />
                      Traffic Potential: {source.traffic}
                    </span>
                    <span className="hidden h-1 w-1 rounded-full bg-brass-300 sm:inline-block" />
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} className="text-success" />
                      Time: {source.time}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-brass-100 hover:text-text-heading"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary h-12 flex-1 py-0 text-sm"
                >
                  <ExternalLink size={15} />
                  Go To Site
                </a>
                <button
                  type="button"
                  onClick={onToggleComplete}
                  className={clsx(
                    "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--mcv-r-pill)] border px-5 text-sm font-medium transition-all sm:min-w-44",
                    isDone
                      ? "border-[var(--mcv-line-brass)] bg-brass-500 text-white shadow-[var(--mcv-shadow-brass)]"
                      : "border-[var(--mcv-line-brass)] bg-brass-100 text-success hover:bg-brass-500 hover:text-white"
                  )}
                >
                  <CheckCircle2 size={16} />
                  {isDone ? "Completed" : "Mark Complete"}
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-canvas/40 px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 [scrollbar-color:var(--mcv-brass-300)_var(--mcv-surface-field)] [scrollbar-width:thin]">
              <section className="rounded-xl border border-border-dim bg-surface p-4 shadow-[var(--mcv-shadow-card)] sm:p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-text-heading">
                  <ListChecks size={16} className="text-success" />
                  Step-By-Step Instructions
                </div>
                <ol className="flex flex-col">
                  {source.instructions.map((step, index) => {
                    const isLast = index === source.instructions.length - 1;
                    return (
                      <li key={index} className="flex gap-3">
                        <div className="flex w-7 shrink-0 flex-col items-center">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brass-500 text-[12px] font-medium text-white shadow-[var(--mcv-shadow-brass)]">
                            {index + 1}
                          </span>
                          {!isLast && (
                            <span className="my-1 w-px flex-1 bg-[var(--mcv-line-brass)]" />
                          )}
                        </div>
                        <p
                          className={clsx(
                            "min-w-0 flex-1 text-sm leading-relaxed text-text-secondary",
                            isLast ? "pb-0" : "pb-4"
                          )}
                        >
                          {renderCopy(step)}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <section className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-sm font-medium text-success">
                  <Clipboard size={14} />
                  Use This Description When Submitting
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-border-dim bg-surface p-3.5 shadow-[var(--mcv-shadow-card)] sm:flex-row sm:items-start">
                  <p className="min-w-0 flex-1 break-words text-sm leading-relaxed text-text-secondary">
                    {renderCopy(source.description)}
                  </p>
                  <button
                    type="button"
                    onClick={onCopyDescription}
                    className={clsx(
                      "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-all",
                      copied
                        ? "bg-brass-500 text-white"
                        : "border border-border-dim bg-field text-text-secondary hover:border-[var(--mcv-line-brass)] hover:text-success"
                    )}
                  >
                    {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    {copied ? "Copied!" : "Copy Description"}
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
