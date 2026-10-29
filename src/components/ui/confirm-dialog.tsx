"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    },
    [loading, onCancel]
  );

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={loading ? undefined : onCancel}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--mcv-line-strong)] bg-raised p-6 shadow-2xl">
        <h2 id="confirm-dialog-title" className="brand-font text-xl text-text-heading">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary w-full sm:w-auto"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={
              destructive
                ? "btn-danger w-full sm:w-auto"
                : "btn-primary w-full sm:w-auto"
            }
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
