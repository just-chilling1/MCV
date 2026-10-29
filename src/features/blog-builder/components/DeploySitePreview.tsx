"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Globe, Link2, Eye, Copy, Check, BadgeDollarSign } from "lucide-react";
import { getAppUrl } from "@/lib/brand-vars";
import { copyToClipboard } from "@/lib/clipboard";
import { sitePublicPath } from "@/lib/app-url";
import type { BlogSite } from "../types";

interface DeploySitePreviewProps {
  site: BlogSite;
  showLiveLink?: boolean;
}

export function DeploySitePreview({ site, showLiveLink = false }: DeploySitePreviewProps) {
  const [copied, setCopied] = useState(false);

  const armedCount = site.armed_links?.length ?? 0;
  const publicPath = sitePublicPath(site);
  const origin = typeof window !== "undefined" ? window.location.origin : getAppUrl();
  const publicUrl = `${origin}${publicPath}`;
  const isLive = site.status === "live";

  const copyUrl = async () => {
    try {
      await copyToClipboard(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-0 max-w-full rounded-xl border border-border-dim bg-white p-5 shadow-sm ring-1 ring-brass-100 sm:p-6"
    >
      <p className="mb-2 text-[13px] font-medium uppercase tracking-[0.2em] text-brass-700">
        Cash asset initialized
      </p>
      <h2 className="brand-font text-xl tracking-tight text-text-heading sm:text-2xl">{site.title}</h2>
      {site.tagline && <p className="mt-1 text-sm text-text-secondary">{site.tagline}</p>}

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--mcv-line-brass)] bg-brass-100 px-3 py-1.5 font-medium text-brass-700">
          <Globe size={14} aria-hidden />
          Topic: {site.hobby}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-dim bg-canvas px-3 py-1.5 font-medium text-text-secondary">
          <Link2 size={14} className="text-brass-700" aria-hidden />
          {armedCount} product link{armedCount === 1 ? "" : "s"}
        </span>
      </div>

      {isLive && (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-medium text-text-muted">
            Your link — share this anywhere you promote:
          </p>
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border-dim bg-canvas px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-text-primary">
              {publicUrl}
            </span>
            <button
              type="button"
              onClick={() => void copyUrl()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brass-100 px-2.5 py-1.5 text-xs font-medium text-brass-700 transition-colors hover:bg-brass-200"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {showLiveLink && isLive && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`${publicPath}#start`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open the questionnaire from the first step"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-grad-brass px-5 py-3 text-sm font-medium text-text-on-accent shadow-brass transition-all hover:brightness-105"
          >
            <Eye size={16} aria-hidden />
            Check questionnaire page
          </Link>
          <Link
            href={`/offers/${encodeURIComponent(site.id)}`}
            title="Open this offer's page — links, threads, and settings"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 px-5 py-3 text-sm font-medium text-brass-700 transition-colors hover:bg-brass-200"
          >
            <BadgeDollarSign size={16} aria-hidden />
            Check offer page
          </Link>
        </div>
      )}
    </motion.div>
  );
}
