"use client";

import { useState } from "react";
import { Copy, Check, Facebook } from "lucide-react";
import { clsx } from "clsx";
import type { SavedFacebookPost } from "../lib/facebook-posts-vault";
import { copyToClipboard } from "@/lib/clipboard";

interface FacebookPostCardProps {
  post: SavedFacebookPost;
  resolvedText: string;
}

export function FacebookPostCard({ post, resolvedText }: FacebookPostCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(resolvedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-dim/90 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wider text-text-muted">
          <Facebook size={12} className="text-brass-700" aria-hidden />
          {new Date(post.created_at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
        {resolvedText}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className={clsx(
          "inline-flex items-center justify-center gap-2 self-start rounded-lg px-4 py-2 text-[13px] font-medium uppercase tracking-wide transition-all duration-200 active:scale-[0.98]",
          copied
            ? "bg-success text-white"
            : "bg-grad-brass text-text-on-accent shadow-brass hover:brightness-110 hover:shadow-brass"
        )}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" aria-hidden />
            Copy post
          </>
        )}
      </button>
    </div>
  );
}
