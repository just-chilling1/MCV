"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Hash,
  ExternalLink,
  Megaphone,
  ChevronDown,
  Loader2,
  Download,
  ClipboardCopy,
  Pin,
} from "lucide-react";
import { clsx } from "clsx";
import { fetchJson } from "@/lib/fetch-json";
import { copyToClipboard } from "@/lib/clipboard";
import { THREADS_PER_GENERATION, THREAD_IMAGE_POST_INDEXES } from "../lib/promote-constants";
import {
  downloadTextFile,
  formatPromotionKit,
  formatThreadPosts,
  promotionKitFilename,
  threadExportFilename,
} from "../lib/thread-export";
import {
  groupThreadsIntoVersions,
  sortVersionsForDisplay,
  threadVersionName,
  formatThreadVersionDate,
  preferredVersion,
  type ThreadVersion,
} from "../lib/thread-batches";
import type { SavedXThread } from "../lib/x-threads-vault";
import { ThreadCard } from "./ThreadCard";
import { GenerationProgress } from "@/components/ui/generation-progress";
import type {
  PromotePlatform,
  PublishKitSite,
  SocialPostResult,
} from "../types";
import type { ThreadGenerationQuota } from "../lib/thread-generation-quota";

function versionToPosts(version: ThreadVersion): SocialPostResult[] {
  return version.posts.map((post) => ({
    text: post.text,
    angle: post.angle || undefined,
    imageUrl: post.image_url || undefined,
  }));
}

const THREAD_POST_COUNT = THREADS_PER_GENERATION;
const THREAD_IMAGE_COUNT = THREAD_IMAGE_POST_INDEXES.length;
const PROMOTE_PLATFORM = "twitter" as const;

function CollapsibleResultSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-xl border border-border-dim bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 bg-white px-4 py-3 transition-colors hover:bg-canvas [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={16}
          className="shrink-0 text-ink-4 transition-transform group-open:rotate-180"
        />
        <span className="min-w-0 flex-1 text-sm font-medium text-ink">{title}</span>
        {count !== undefined && (
          <span className="shrink-0 rounded-full bg-brass-100 px-2 py-0.5 text-[13px] font-medium text-ink-3">
            {count}
          </span>
        )}
      </summary>
      <div className="space-y-2 border-t border-border-dim bg-canvas p-2">{children}</div>
    </details>
  );
}

function CollapsibleResultItem({
  label,
  preview,
  children,
  defaultOpen = false,
}: {
  label: string;
  preview?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-lg border border-border-dim bg-white"
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 bg-white px-3 py-2.5 transition-colors hover:bg-canvas [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={14}
          className="mt-0.5 shrink-0 text-ink-4 transition-transform group-open:rotate-180"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium uppercase tracking-wide text-brass-700">{label}</p>
          {preview && (
            <p className="mt-0.5 line-clamp-2 text-sm text-ink-2 group-open:hidden">{preview}</p>
          )}
        </div>
      </summary>
      <div className="border-t border-border-dim bg-white px-3 py-3">{children}</div>
    </details>
  );
}

function KitButton({
  children,
  onClick,
  loading,
  disabled,
  variant = "secondary",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-grad-brass text-text-on-accent shadow-brass hover:brightness-110 hover:shadow-brass active:scale-[0.98]"
      : variant === "ghost"
        ? "text-ink-2 hover:bg-brass-100 hover:text-ink active:scale-[0.98]"
        : "btn-subtle";

  return (
    <button type="button" onClick={onClick} disabled={loading || disabled} className={`${base} ${styles} ${className}`}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function PublishKitPanel({ site }: { site: PublishKitSite }) {
  const [threads, setThreads] = useState<SavedXThread[]>([]);
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);
  const [tags, setTags] = useState<{ tag: string; reason: string }[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [quota, setQuota] = useState<ThreadGenerationQuota | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  const visibleTags = tags;

  const promoLink = useMemo(() => site.siteUrl || "", [site.siteUrl]);

  // Saved threads grouped into versions (batches), pinned first then newest.
  const versions = useMemo(() => groupThreadsIntoVersions(threads), [threads]);
  const displayVersions = useMemo(() => sortVersionsForDisplay(versions), [versions]);
  const versionNumbers = useMemo(() => {
    const map = new Map<string, number>();
    versions.forEach((v, i) => map.set(v.batchId, versions.length - i));
    return map;
  }, [versions]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // The parent remounts this panel per site (key={siteId}), so contentLoading
  // starts true for each site without resetting it inside the effect.
  useEffect(() => {
    void fetchJson<{
      quota: ThreadGenerationQuota;
      threads?: SavedXThread[];
      tags?: { tag: string; reason: string }[];
    }>(`/api/promote/social-posts?siteId=${encodeURIComponent(site.siteId)}`)
      .then((res) => {
        if (!res.ok) return;
        if (res.data.quota) setQuota(res.data.quota);
        setThreads(Array.isArray(res.data.threads) ? res.data.threads : []);
        setTags(Array.isArray(res.data.tags) ? res.data.tags : []);
      })
      .catch(() => {})
      .finally(() => setContentLoading(false));
  }, [site.siteId]);

  const refreshThreads = useCallback(async () => {
    const res = await fetchJson<{ threads?: SavedXThread[] }>(
      `/api/promote/social-posts?siteId=${encodeURIComponent(site.siteId)}`
    );
    if (res.ok && Array.isArray(res.data.threads)) {
      setThreads(res.data.threads);
    }
  }, [site.siteId]);

  const quotaBlocked = quota !== null && quota.remaining <= 0;
  const isGenerating = generateLoading || tagsLoading;

  const showToast = (message: string, variant: "success" | "error" | "info" = "info") => {
    setToast({ message, variant });
  };

  const copy = async (key: string, text: string) => {
    try {
      await copyToClipboard(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      showToast("Could not copy to clipboard", "error");
    }
  };

  const copyVersion = async (version: ThreadVersion) => {
    try {
      await copyToClipboard(formatThreadPosts(versionToPosts(version)));
      setCopiedKey(`version-${version.batchId}`);
      showToast(`Copied all ${version.posts.length} posts to clipboard`, "success");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      showToast("Could not copy to clipboard", "error");
    }
  };

  const downloadVersion = (version: ThreadVersion) => {
    downloadTextFile(
      threadExportFilename(site.siteName),
      formatThreadPosts(versionToPosts(version))
    );
    showToast("Story thread downloaded", "success");
  };

  const downloadPromotionKit = () => {
    const kitVersion =
      versions.find((v) => v.batchId === openBatchId) ?? preferredVersion(versions);
    if (!kitVersion && visibleTags.length === 0) {
      showToast("Generate a thread or hashtags first", "info");
      return;
    }
    downloadTextFile(
      promotionKitFilename(site.siteName),
      formatPromotionKit({
        siteName: site.siteName,
        territory: site.territory,
        promoLink: promoLink || undefined,
        posts: kitVersion ? versionToPosts(kitVersion) : [],
        tags: visibleTags,
      })
    );
    showToast("Full promotion kit downloaded", "success");
  };

  const runGenerate = async () => {
    if (!promoLink) {
      showToast("Publish your offer page before generating threads.", "info");
      return;
    }

    setGenerateLoading(true);
    const res = await fetchJson<{
      platform: PromotePlatform;
      posts: SocialPostResult[];
      batchId?: string | null;
      quota?: ThreadGenerationQuota;
    }>("/api/promote/social-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: site.siteId,
        siteUrl: site.siteUrl,
        platform: PROMOTE_PLATFORM,
      }),
    });

    if (!res.ok) {
      setGenerateLoading(false);
      showToast(res.error, "error");
      return;
    }

    if (res.data.quota) setQuota(res.data.quota);
    await refreshThreads();
    setGenerateLoading(false);
    // Expand the freshly generated version so results are immediately visible.
    if (res.data.batchId) setOpenBatchId(res.data.batchId);
    showToast(`Story thread ready — ${THREAD_POST_COUNT} posts, ${THREAD_IMAGE_COUNT} niche images on posts 1, 4, and 7`, "success");
  };

  const runTags = async () => {
    setTagsLoading(true);
    const res = await fetchJson<{ tags: { tag: string; reason: string }[] }>("/api/suggest-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: site.siteId,
        platform: PROMOTE_PLATFORM,
        articleTitle: site.siteName,
        articleContent: `${site.territory}. ${site.tagline || site.affiliateLabel || ""}`.trim(),
        niche: site.territory,
      }),
    });
    setTagsLoading(false);

    if (!res.ok) {
      showToast(res.error, "error");
      return;
    }
    setTags(res.data.tags || []);
  };

  return (
    <div className="flex flex-col gap-6 min-w-0">
      {toast && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${ toast.variant === "error" ? "border-[var(--mcv-danger)]/20 bg-[var(--mcv-danger)]/10 text-[var(--mcv-danger)]" : toast.variant === "success" ? "border-[var(--mcv-line-brass)] bg-brass-100 text-text-heading" : "border-border-dim bg-brass-100 text-ink-2" }`}
        >
          {toast.message}
        </div>
      )}

      <div className="glass-card flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-medium uppercase tracking-widest text-brass-700">X-Power Promotions</p>
            <h2 className="mt-1 brand-font text-xl text-text-heading">{site.siteName}</h2>
            {site.tagline && <p className="mt-1 text-sm text-text-secondary">{site.tagline}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--mcv-line-brass)] bg-brass-100 px-2 py-0.5 text-[13px] font-medium text-brass-700">
                {site.territory}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[13px] font-medium capitalize ${ site.status === "live" ? "border border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700" : "bg-brass-100 text-ink-3" }`}
              >
                {site.status}
              </span>
            </div>
          </div>
          {site.siteUrl && (
            <a
              href={site.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link-action shrink-0 text-xs"
            >
              View live site
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        <section className="space-y-3">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-text-heading flex items-center gap-2">
              <Sparkles size={16} className="text-brass-700" />
              Generate story thread
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Generate one {THREAD_POST_COUNT}-post product story thread — hook, failure, mechanism, proof, and a single CTA.
              Posts 1, 4, and 7 include scraped product or stock niche images. Each generation is saved
              as a new thread in your Offers Library, so previous versions are kept.
            </p>
            {contentLoading ? (
              <p className="text-sm text-text-muted flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Loading saved promotion content...
              </p>
            ) : null}
            {quota && (
              <p className="text-[13px] font-medium text-text-secondary">
                {quota.remaining} of {quota.limit} generations remaining today
              </p>
            )}
            <GenerationProgress
              active={isGenerating}
              label={
                generateLoading
                  ? `Generating ${THREAD_POST_COUNT}-post thread + ${THREAD_IMAGE_COUNT} niche images...`
                  : "Suggesting hashtags for your promotion..."
              }
              scrollTargetId={
                generateLoading
                  ? "generation-results-thread"
                  : tagsLoading
                    ? "generation-results-tags"
                    : undefined
              }
            />
            <div className="space-y-2">
              <KitButton
                variant="primary"
                onClick={runGenerate}
                loading={generateLoading}
                disabled={quotaBlocked}
                className="w-full sm:w-fit px-5 py-3"
              >
                <Megaphone size={14} />
                {generateLoading
                  ? `Generating ${THREAD_POST_COUNT}-post thread + ${THREAD_IMAGE_COUNT} images`
                  : versions.length > 0
                    ? "Generate new story thread"
                    : "Generate story thread"}
              </KitButton>
              {versions.length > 0 && !generateLoading && (
                <p className="text-xs text-text-muted">
                  Each generation is saved as a new version — your older threads stay below.
                </p>
              )}
            </div>
          </div>

          {versions.length > 0 && (
            <div id="generation-results-thread" className="scroll-mt-24 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-text-secondary">
                  Saved thread versions ({versions.length})
                </p>
                {(visibleTags.length > 0 || promoLink) && (
                  <KitButton variant="ghost" onClick={downloadPromotionKit}>
                    <Download size={14} />
                    Download full kit
                  </KitButton>
                )}
              </div>

              {displayVersions.map((version) => {
                const open = openBatchId === version.batchId;
                return (
                  <section
                    key={version.batchId}
                    className="overflow-hidden rounded-xl border border-border-dim bg-white shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2 pr-3">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenBatchId((prev) =>
                            prev === version.batchId ? null : version.batchId
                          )
                        }
                        aria-expanded={open}
                        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas"
                      >
                        <ChevronDown
                          size={16}
                          className={clsx(
                            "shrink-0 text-ink-4 transition-transform",
                            open && "rotate-180"
                          )}
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                            {version.pinned && (
                              <Pin size={13} className="shrink-0 text-brass-700" aria-label="Pinned" />
                            )}
                            {threadVersionName(version, versionNumbers.get(version.batchId) ?? 1)}
                          </p>
                          <p className="text-xs text-text-muted">
                            Generated {formatThreadVersionDate(version.createdAt)} ·{" "}
                            {version.posts.length} post{version.posts.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </button>
                      <div className="flex shrink-0 gap-1.5">
                        <KitButton variant="secondary" onClick={() => void copyVersion(version)}>
                          {copiedKey === `version-${version.batchId}` ? (
                            <Check size={13} />
                          ) : (
                            <ClipboardCopy size={13} />
                          )}
                          Copy all
                        </KitButton>
                        <KitButton variant="ghost" onClick={() => downloadVersion(version)}>
                          <Download size={13} />
                        </KitButton>
                      </div>
                    </div>

                    {open && (
                      <div className="space-y-2 border-t border-border-dim bg-canvas p-2">
                        {version.posts.map((post, i) => (
                          <ThreadCard
                            key={post.id}
                            index={i + 1}
                            label={`Post ${i + 1} · ${post.angle || "Post"}`}
                            text={post.text}
                            imageUrl={post.image_url || undefined}
                            defaultOpen={i === 0}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3 border-t border-border-dim pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-text-heading flex items-center gap-2">
              <Hash size={16} className="text-brass-700" />
              Bonus hashtags
            </h3>
            <KitButton onClick={runTags} loading={tagsLoading}>
              Suggest for X
            </KitButton>
          </div>
          {visibleTags.length > 0 && (
            <div id="generation-results-tags" className="scroll-mt-24">
            <CollapsibleResultSection title="Suggested tags" count={visibleTags.length}>
              {visibleTags.map((t) => (
                <CollapsibleResultItem key={t.tag} label={t.tag} preview={t.reason}>
                  <p className="text-sm leading-relaxed text-ink-2">{t.reason}</p>
                  <KitButton variant="ghost" className="mt-2" onClick={() => copy(`tag-${t.tag}`, t.tag)}>
                    {copiedKey === `tag-${t.tag}` ? <Check size={14} /> : <Copy size={14} />}
                    Copy tag
                  </KitButton>
                </CollapsibleResultItem>
              ))}
              <KitButton
                variant="ghost"
                className="mt-1 w-full"
                onClick={() => copy("alltags", visibleTags.map((x) => x.tag).join(" "))}
              >
                {copiedKey === "alltags" ? <Check size={14} /> : <Copy size={14} />}
                Copy all tags
              </KitButton>
            </CollapsibleResultSection>
            </div>
          )}
        </section>

        {promoLink && (
          <div className="flex flex-wrap gap-2 border-t border-border-dim pt-6">
            <KitButton variant="secondary" onClick={() => copy("link", promoLink)}>
              {copiedKey === "link" ? <Check size={16} /> : <Copy size={16} />}
              Copy promotion link
            </KitButton>
          </div>
        )}
      </div>
    </div>
  );
}
