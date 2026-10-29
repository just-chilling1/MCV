"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Eye, FileText, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { AiLoadingBar } from "@/components/ui/AiLoadingBar";
import type { BlogPost, PostSlotState } from "../types";

export type { PostSlotStatus } from "../types";
export type { PostSlotState };

interface DeployPostSlotProps {
  slot: PostSlotState;
  index: number;
  isPillar?: boolean;
  onViewPost?: (postId: string) => void;
}

function ShimmerBlock({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-black/5 animate-pulse ${className}`} />;
}

function PostHeroImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
        <ImageIcon className="text-ink-6" size={40} />
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function slotShellClass(status: PostSlotState["status"]) {
  if (status === "complete") return "glass-card border-[var(--mcv-line-brass)]";
  if (status === "generating") return "glass-card border-[var(--mcv-line-brass)] max-sm:shadow-none sm:shadow-[var(--glow-teal)]";
  if (status === "error") return "glass-card border-[var(--mcv-danger)]/40";
  return "glass-tile";
}

export function DeployPostSlot({ slot, index, isPillar, onViewPost }: DeployPostSlotProps) {
  const { topic, status, progress, post } = slot;
  const imagePending = Boolean(post && !post.image_url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border ${slotShellClass(status)} ${ isPillar ? "sm:col-span-2" : "" }`}
    >
      <AnimatePresence mode="wait">
        {status === "complete" && post ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full"
          >
            {post.image_url ? (
              <div className="relative">
                <PostHeroImage src={post.image_url} alt={post.image_alt ?? post.title} />
                <div className="absolute top-2 right-2 status-pill-active">
                  <CheckCircle2 size={12} />
                  Ready
                </div>
              </div>
            ) : (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/5 flex flex-col items-center justify-center gap-2">
                <Loader2 size={22} className="text-brass-700 animate-spin" />
                <p className="text-[13px] uppercase tracking-wider text-text-muted">Adding hero image...</p>
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {(post.is_pillar || isPillar) && (
                    <span className="status-pill-gold mb-1">Pillar</span>
                  )}
                  <h3 className="brand-font text-sm leading-snug text-text-heading sm:text-base">
                    {post.title}
                  </h3>
                </div>
              </div>
              {post.excerpt && (
                <p className="text-xs leading-relaxed text-text-muted line-clamp-2">{post.excerpt}</p>
              )}
              <div className="mt-auto flex min-w-0 flex-col gap-2 pt-2">
                <AiLoadingBar
                  label={imagePending ? "Text ready — image loading" : "Generated"}
                  progress={imagePending ? Math.max(progress, 85) : 100}
                  active={imagePending}
                  className="w-full min-w-0"
                />
                {onViewPost && (
                  <button
                    type="button"
                    onClick={() => onViewPost(post.id)}
                    className="btn-primary w-full text-xs py-2.5"
                  >
                    <Eye size={14} />
                    View article
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 flex flex-col gap-3 h-full min-h-[180px]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {isPillar && <span className="status-pill-gold mb-1 opacity-80">Pillar</span>}
                <p className="text-sm text-text-primary font-medium truncate">{topic.title}</p>
              </div>
              {status === "generating" ? (
                <Loader2 size={16} className="text-brass-700 animate-spin shrink-0" />
              ) : status === "queued" ? (
                <FileText size={16} className="text-text-muted/50 shrink-0" />
              ) : (
                <Sparkles size={16} className="text-brass-700 shrink-0" />
              )}
            </div>

            <ShimmerBlock className="h-24 w-full rounded-lg" />

            <div className="space-y-2 flex-1">
              <ShimmerBlock className="h-2.5 w-full" />
              <ShimmerBlock className="h-2.5 w-[80%]" />
            </div>

            {status === "generating" && (
              <AiLoadingBar label="AI writing article" progress={progress} active className="mt-auto w-full min-w-0" />
            )}
            {status === "queued" && (
              <p className="text-[13px] uppercase tracking-wider text-text-muted/70 mt-auto">
                Queued — waiting to generate
              </p>
            )}
            {status === "error" && (
              <p className="text-xs text-[var(--mcv-danger)]/90 mt-auto">{slot.error ?? "Generation failed"}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface DeployPostGridProps {
  slots: PostSlotState[];
  onViewPost?: (postId: string) => void;
}

export function DeployPostGrid({ slots, onViewPost }: DeployPostGridProps) {
  const pillar = slots.find((s) => s.topic.isPillar);
  const clusters = slots.filter((s) => !s.topic.isPillar);
  const completed = slots.filter((s) => s.status === "complete").length;

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-4 overflow-x-clip">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-brass-700">
          Content pipeline
        </p>
        <p className="shrink-0 text-xs tabular-nums text-text-muted">
          {completed}/{slots.length} posts ready
        </p>
      </div>

      {pillar && <DeployPostSlot slot={pillar} index={0} isPillar onViewPost={onViewPost} />}

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {clusters.map((slot, i) => (
          <DeployPostSlot key={slot.topic.slug} slot={slot} index={i + 1} onViewPost={onViewPost} />
        ))}
      </div>
    </div>
  );
}
