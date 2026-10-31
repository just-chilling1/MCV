"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ClipboardCopy, ImageIcon, X } from "lucide-react";
import { ThreadCard } from "./ThreadCard";
import { formatThreadPosts } from "../lib/thread-export";
import { copyToClipboard } from "@/lib/clipboard";
import { formatThreadVersionDate, type ThreadVersion } from "../lib/thread-batches";

interface ThreadViewerModalProps {
  open: boolean;
  offerTitle: string;
  version: ThreadVersion | null;
  onClose: () => void;
}

function ThreadViewerContent({
  offerTitle,
  version,
  onClose,
}: {
  offerTitle: string;
  version: ThreadVersion;
  onClose: () => void;
}) {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const imageCount = version.posts.filter((p) => p.image_url).length;
  const dateLabel = formatThreadVersionDate(version.createdAt);

  const copyAll = async () => {
    try {
      await copyToClipboard(
        formatThreadPosts(
          version.posts.map((p) => ({
            text: p.text,
            angle: p.angle || undefined,
            imageUrl: p.image_url || undefined,
          }))
        )
      );
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thread-viewer-title"
    >
      <button
        type="button"
        aria-label="Close thread viewer"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border-dim bg-white shadow-2xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-border-dim/70 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="thread-viewer-title" className="brand-font truncate text-xl text-text-heading">
              {version.label?.trim() || "X story thread"}
            </h2>
            <p className="mt-0.5 truncate text-sm text-text-secondary">
              {offerTitle}
              {dateLabel ? ` · ${dateLabel}` : ""} · {version.posts.length} posts
              {imageCount > 0 ? ` · ${imageCount} image${imageCount !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void copyAll()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-dim bg-white px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:border-[var(--mcv-line-brass)] hover:text-brass-700"
            >
              {copiedAll ? <Check size={14} /> : <ClipboardCopy size={14} />}
              {copiedAll ? "Copied!" : "Copy all posts"}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-canvas hover:text-text-primary"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto bg-canvas/40 p-4">
          {version.posts.map((post, i) => (
            <ThreadCard
              key={post.id}
              index={i + 1}
              label={`Post ${i + 1} · ${post.angle || "Post"}`}
              text={post.text}
              imageUrl={post.image_url}
              defaultOpen={i === 0}
            />
          ))}
          {imageCount > 0 && (
            <p className="flex items-center gap-1.5 px-1 pt-1 text-xs text-text-muted">
              <ImageIcon size={12} />
              Posts with an Image badge include a niche visual — expand them to copy the image URL.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ThreadViewerModal({ open, offerTitle, version, onClose }: ThreadViewerModalProps) {
  if (!open || !version || typeof document === "undefined") return null;

  return createPortal(
    <ThreadViewerContent
      key={version.batchId}
      offerTitle={offerTitle}
      version={version}
      onClose={onClose}
    />,
    document.body
  );
}
