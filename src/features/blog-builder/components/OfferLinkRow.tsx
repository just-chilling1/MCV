"use client";

import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Check, Copy, ExternalLink, type LucideIcon } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

export function CopyUrlButton({
  url,
  label = "Copy URL",
  primary = false,
}: {
  url: string;
  label?: string;
  primary?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={clsx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        primary
          ? "border border-[var(--mcv-line-brass)] bg-grad-brass text-black hover:opacity-90"
          : "border border-border-dim bg-white text-text-secondary hover:border-[var(--mcv-line-brass)] hover:text-brass-700"
      )}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function OfferLinkRow({
  icon: Icon,
  title,
  url,
  primary = false,
  action,
}: {
  icon: LucideIcon;
  title: string;
  url: string;
  /** Emphasized styling for the main link the user should share. */
  primary?: boolean;
  /** Extra action rendered after Copy/Open (e.g. a Change button). */
  action?: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3",
        primary
          ? "border-[var(--mcv-line-brass)] bg-brass-100/50"
          : "border-border-dim bg-page/60"
      )}
    >
      <div
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          primary
            ? "bg-grad-brass text-black"
            : "border border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700"
        )}
      >
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            "text-[13px] font-medium uppercase tracking-wider",
            primary ? "text-brass-700" : "text-text-secondary"
          )}
        >
          {title}
        </p>
        <p className="truncate text-sm text-text-muted">{url}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <CopyUrlButton url={url} primary={primary} />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-dim bg-white px-2.5 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-[var(--mcv-line-brass)] hover:text-brass-700"
        >
          <ExternalLink size={13} />
          Open
        </a>
        {action}
      </div>
    </div>
  );
}
