"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { Copy, Eye, Loader2, MessageSquare, X } from "lucide-react";
import { ProductSiteView } from "@/features/blog-builder/themes/ProductSiteView";
import { ThreadCard } from "@/features/publish-kit/components/ThreadCard";
import { ThreadListSection } from "@/features/publish-kit/components/ThreadListSection";
import type { AcceleratorTemplatePreview } from "@/features/premium-accelerator/lib/load-template-preview";

type PreviewTab = "sales-page" | "thread";

interface TemplatePreviewOverlayProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string;
  preview: AcceleratorTemplatePreview | null;
  productName?: string;
  hasAffiliateLink: boolean;
  isCloning: boolean;
  onUseTemplate: () => void;
}

export function TemplatePreviewOverlay({
  open,
  onClose,
  loading,
  error,
  preview,
  productName,
  hasAffiliateLink,
  isCloning,
  onUseTemplate,
}: TemplatePreviewOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<PreviewTab>("sales-page");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    setTab("sales-page");
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!mounted || !open) return null;

  const title = preview?.productName ?? productName ?? "Template preview";
  const threadCount = preview?.threads.length ?? 0;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative z-10 flex h-[min(94dvh,56rem)] w-full max-w-5xl flex-col overflow-hidden border border-border-dim bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accelerator-preview-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-dim bg-surface px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
          <div className="min-w-0">
            {preview?.niche && (
              <p className="text-[13px] font-medium uppercase tracking-wider text-brass-700">{preview.niche}</p>
            )}
            <h2 id="accelerator-preview-title" className="truncate text-sm font-medium text-text-heading sm:text-base">
              {title}
            </h2>
            {preview?.templateName && (
              <p className="mt-0.5 truncate text-xs text-text-muted">{preview.templateName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-all duration-200 hover:bg-brass-100 hover:text-text-heading active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-divider bg-canvas/80 px-4 py-2 sm:px-5">
          <button
            type="button"
            onClick={() => setTab("sales-page")}
            className={clsx(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === "sales-page"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            <Eye size={14} />
            Sales page
          </button>
          <button
            type="button"
            onClick={() => setTab("thread")}
            className={clsx(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === "thread"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            <MessageSquare size={14} />
            X thread
            {threadCount > 0 && (
              <span className="rounded-full bg-brass-100 px-2 py-0.5 text-[13px] font-medium text-brass-700">
                {threadCount}
              </span>
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-canvas/40">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-text-muted">
              <Loader2 size={28} className="animate-spin text-brass-700" />
              <p className="text-sm">Loading template preview…</p>
            </div>
          )}

          {!loading && error && (
            <div className="m-4 rounded-lg border border-[var(--mcv-danger)]/20 bg-[var(--mcv-danger)]/10 px-4 py-3 text-[15px] text-[var(--mcv-danger)]">
              {error}
            </div>
          )}

          {!loading && !error && preview && tab === "sales-page" && (
            <div className="accelerator-preview-sales-page bg-white">
              <ProductSiteView html={preview.salesPageHtml} />
            </div>
          )}

          {!loading && !error && preview && tab === "thread" && (
            <div className="space-y-4 p-4 sm:p-5">
              {preview.threads.length > 0 ? (
                <ThreadListSection title="Story thread" count={preview.threads.length}>
                  {preview.threads.map((thread, i) => (
                    <ThreadCard
                      key={i}
                      index={i + 1}
                      label={`Post ${i + 1} · ${thread.angle || "Post"}`}
                      text={thread.text}
                      imageUrl={thread.image_url}
                      defaultOpen={i === 0}
                    />
                  ))}
                </ThreadListSection>
              ) : (
                <p className="rounded-xl border border-divider bg-white px-4 py-8 text-center text-sm text-text-muted">
                  No X thread posts saved for this template yet.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-divider bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <p className="text-xs text-text-muted">
            {hasAffiliateLink
              ? "Sales page CTAs use your affiliate link. Thread post 10 links to your offer page."
              : "Add your affiliate link above to preview the sales page CTA."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
              Close
            </button>
            <button
              type="button"
              disabled={!preview || !hasAffiliateLink || isCloning}
              onClick={onUseTemplate}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-40"
            >
              {isCloning ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
              Use this template
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
