"use client";

import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { ContactSupportWidget } from "@/components/dashboard/ContactSupportWidget";
import { support } from "@/config/support.config";

export function FloatingSupportButton() {
  const [open, setOpen] = useState(false);
  const { floatingWidget } = support;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close support panel"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={floatingWidget.ariaLabel}
          className="support-float-trigger fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-full border border-[var(--mcv-line-brass)] bg-grad-brass px-5 py-3 text-sm font-medium text-text-on-accent shadow-brass ring-2 ring-white/80 transition-all hover:brightness-110 hover:shadow-brass active:scale-[0.98] sm:bottom-6 sm:right-6 max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom))]"
        >
          <HelpCircle className="h-5 w-5 shrink-0" aria-hidden />
          {floatingWidget.label}
        </button>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={floatingWidget.panelTitle}
          className="support-float-panel fixed bottom-4 right-4 z-50 flex max-h-[min(80vh,640px)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border-dim bg-white shadow-xl sm:bottom-6 sm:right-6 max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom))]"
        >
          <div className="flex items-center justify-between border-b border-border-dim bg-white px-4 py-3.5">
            <div className="min-w-0">
              <span className="block text-[13px] font-medium uppercase tracking-widest text-text-heading">
                {floatingWidget.panelTitle}
              </span>
              {floatingWidget.panelSubtitle ? (
                <span className="mt-0.5 block text-xs leading-snug text-text-secondary">
                  {floatingWidget.panelSubtitle}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support panel"
              className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-brass-100 hover:text-text-heading"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="support-widget-scroll min-h-0 flex-1 overflow-y-auto p-3 pb-4">
            <ContactSupportWidget embedded />
          </div>
        </div>
      ) : null}
    </>
  );
}
