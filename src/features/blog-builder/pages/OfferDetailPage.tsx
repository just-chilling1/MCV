"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCopy,
  Eye,
  FileText,
  Globe,
  Link2,
  Loader2,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  Pencil,
  Pin,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ThreadViewerModal } from "@/features/publish-kit/components/ThreadViewerModal";
import { ThreadListSection } from "@/features/publish-kit/components/ThreadListSection";
import { FacebookPostCard } from "@/features/blog-builder/components/FacebookPostCard";
import { OfferLinkRow } from "@/features/blog-builder/components/OfferLinkRow";
import { LinkEditorOverlay } from "@/features/blog-builder/components/LinkEditorOverlay";
import { sanitizePostHtml } from "@/features/blog-builder/lib/sanitize-html";
import {
  formatThreadVersionDate,
  groupThreadsIntoVersions,
  sortVersionsForDisplay,
  threadVersionName,
  type ThreadVersion,
} from "@/features/publish-kit/lib/thread-batches";
import { formatThreadPosts } from "@/features/publish-kit/lib/thread-export";
import { getSiteTerritory } from "@/features/blog-builder/lib/site-territory";
import { getAppUrl } from "@/lib/brand-vars";
import { copyToClipboard } from "@/lib/clipboard";
import { sitePublicPath } from "@/lib/app-url";
import { invalidateClientFetchCache } from "@/lib/client-fetch-cache";
import type { ArmedLink, BlogSite } from "@/features/blog-builder/types";
import { PublishKitPanel } from "@/features/publish-kit/components/PublishKitPanel";
import type { PublishKitSite } from "@/features/publish-kit/types";
import type { SavedXThread } from "@/features/publish-kit/lib/x-threads-vault";
import type { SavedFacebookPost } from "@/features/blog-builder/lib/facebook-posts-vault";
import type { SavedRecurringArticle } from "@/features/premium-recurring/lib/recurring-articles-vault";

const QUICK_ACTION_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-border-dim bg-white px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:border-[var(--mcv-line-brass)] hover:text-brass-700";

function toPublishKitSite(site: BlogSite, siteUrl: string): PublishKitSite {
  const affiliate = site.armed_links?.[0];
  return {
    siteId: site.id,
    siteName: site.title,
    siteUrl,
    territory: getSiteTerritory(site),
    tagline: site.tagline,
    affiliateLink: affiliate?.url,
    affiliateLabel: affiliate?.label,
    status: site.status,
  };
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ThreadVersionRow({
  version,
  name,
  onView,
  onDelete,
  onRename,
  onTogglePin,
}: {
  version: ThreadVersion;
  name: string;
  onView: () => void;
  onDelete: () => void;
  onRename: (label: string) => Promise<boolean>;
  onTogglePin: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [savingName, setSavingName] = useState(false);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const startEditing = () => {
    setDraftName(name);
    setEditing(true);
  };

  const saveName = async () => {
    setSavingName(true);
    const ok = await onRename(draftName.trim());
    setSavingName(false);
    if (ok) setEditing(false);
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
        version.pinned
          ? "border-[var(--mcv-line-brass)] bg-brass-100/40"
          : "border-border-dim bg-page/60"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700">
        <Megaphone size={15} />
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveName();
                if (e.key === "Escape") setEditing(false);
              }}
              maxLength={60}
              autoFocus
              aria-label="Thread name"
              className="input-base w-full max-w-[240px] px-2.5 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => void saveName()}
              disabled={savingName}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--mcv-line-brass)] bg-brass-100 px-2.5 py-1.5 text-[13px] font-medium text-brass-700 hover:bg-brass-100/70"
            >
              {savingName ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={savingName}
              aria-label="Cancel rename"
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-text-muted hover:bg-canvas hover:text-text-primary"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-text-primary">{name}</p>
            {version.pinned && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brass-100 px-2 py-0.5 text-[13px] font-medium text-brass-700">
                <Pin size={10} />
                Pinned
              </span>
            )}
            <button
              type="button"
              onClick={startEditing}
              aria-label={`Rename ${name}`}
              className="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-text-muted transition-colors hover:bg-canvas hover:text-brass-700"
            >
              <Pencil size={13} />
            </button>
          </div>
        )}
        <p className="mt-0.5 text-xs text-text-muted">
          Generated {formatThreadVersionDate(version.createdAt)}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <button type="button" onClick={onView} className={QUICK_ACTION_CLASS}>
          <Eye size={14} />
          View
        </button>
        <button type="button" onClick={() => void copyAll()} className={QUICK_ACTION_CLASS}>
          {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
          {copied ? "Copied" : "Copy all"}
        </button>
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={version.pinned ? `Unpin ${name}` : `Pin ${name}`}
          title={version.pinned ? "Unpin" : "Pin as your go-to thread"}
          className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${
            version.pinned
              ? "text-brass-700 hover:bg-brass-100"
              : "text-text-muted hover:bg-canvas hover:text-brass-700"
          }`}
        >
          <Pin size={14} className={version.pinned ? "fill-current" : ""} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${name}`}
          className="inline-flex items-center justify-center rounded-lg p-2 text-text-muted transition-colors hover:bg-[var(--mcv-danger)]/10 hover:text-[var(--mcv-danger)]"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function OfferDetailPage({ siteId }: { siteId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [site, setSite] = useState<BlogSite | null>(null);
  const [threads, setThreads] = useState<SavedXThread[]>([]);
  const [facebookPosts, setFacebookPosts] = useState<SavedFacebookPost[]>([]);
  const [articles, setArticles] = useState<SavedRecurringArticle[]>([]);
  const [clicks, setClicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [viewerVersion, setViewerVersion] = useState<ThreadVersion | null>(null);
  const [deletingVersion, setDeletingVersion] = useState<ThreadVersion | null>(null);
  const [deletingOffer, setDeletingOffer] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);
  const [editingAffiliate, setEditingAffiliate] = useState(false);
  const [showThreadGenerator, setShowThreadGenerator] = useState(false);

  const loadOffer = useCallback(
    (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      return fetch(`/api/blog/site?siteId=${encodeURIComponent(siteId)}`, { cache: "no-store" })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.site) {
            setNotFound(true);
            return;
          }
          setSite(data.site as BlogSite);
          setThreads(Array.isArray(data.xThreads) ? data.xThreads : []);
          setFacebookPosts(Array.isArray(data.facebookPosts) ? data.facebookPosts : []);
          setArticles(Array.isArray(data.recurringArticles) ? data.recurringArticles : []);
          setClicks(typeof data.clicks === "number" ? data.clicks : 0);
        })
        .catch(() => {
          setNotFound(true);
        })
        .finally(() => {
          if (!options?.silent) setLoading(false);
        });
    },
    [siteId]
  );

  useEffect(() => {
    let cancelled = false;
    void loadOffer().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [loadOffer]);

  useEffect(() => {
    if (searchParams.get("generateThread") === "1") {
      setShowThreadGenerator(true);
    }
  }, [searchParams]);

  const versions = useMemo(() => groupThreadsIntoVersions(threads), [threads]);
  const displayVersions = useMemo(() => sortVersionsForDisplay(versions), [versions]);
  // Stable name numbering: oldest thread is #1, regardless of pin order.
  const chronoIndexByBatch = useMemo(() => {
    const map = new Map<string, number>();
    versions.forEach((v, i) => map.set(v.batchId, versions.length - i));
    return map;
  }, [versions]);

  const siteUrl = useMemo(() => {
    if (!site) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : getAppUrl();
    return `${origin}${sitePublicPath(site)}`;
  }, [site]);

  const kitSite = useMemo(
    () => (site && siteUrl ? toPublishKitSite(site, siteUrl) : null),
    [site, siteUrl]
  );

  const toggleThreadGenerator = () => {
    setShowThreadGenerator((open) => {
      const next = !open;
      if (!next) void loadOffer({ silent: true });
      return next;
    });
  };

  const patchThread = async (batchId: string, payload: Record<string, string>) => {
    const res = await fetch("/api/promote/social-posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, batchId, ...payload }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not update this thread. Try again.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleRenameVersion = async (batchId: string, label: string): Promise<boolean> => {
    const ok = await patchThread(batchId, { action: "rename", label });
    if (ok) {
      setThreads((prev) =>
        prev.map((t) => (t.batch_id === batchId ? { ...t, batch_label: label || null } : t))
      );
      invalidateClientFetchCache("/api/blog/site");
    }
    return ok;
  };

  const handleTogglePin = async (version: ThreadVersion) => {
    const nextPinned = !version.pinned;
    const ok = await patchThread(version.batchId, { action: nextPinned ? "pin" : "unpin" });
    if (ok) {
      setThreads((prev) =>
        prev.map((t) => {
          if (nextPinned) return { ...t, is_pinned: t.batch_id === version.batchId };
          if (t.batch_id === version.batchId) return { ...t, is_pinned: false };
          return t;
        })
      );
    }
  };

  const handleChangeAffiliate = async (link: ArmedLink) => {
    const res = await fetch("/api/blog/site", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, armedLink: link }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Could not update the affiliate link.");
    }
    const data = (await res.json().catch(() => ({}))) as { armedLinks?: ArmedLink[] };
    setSite((prev) =>
      prev ? { ...prev, armed_links: data.armedLinks ?? [link] } : prev
    );
    invalidateClientFetchCache("/api/blog/site");
  };

  const handleDeleteVersion = async () => {
    if (!deletingVersion) return;
    setDeleteBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/promote/social-posts?siteId=${encodeURIComponent(siteId)}&batchId=${encodeURIComponent(deletingVersion.batchId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not delete this thread. Try again.");
        return;
      }
      const deletedBatch = deletingVersion.batchId;
      setThreads((prev) => prev.filter((t) => t.batch_id !== deletedBatch));
      setDeletingVersion(null);
      invalidateClientFetchCache("/api/blog/site");
    } catch {
      setError("Could not delete this thread. Try again.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleDeleteOffer = async () => {
    setDeleteBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog/site?siteId=${encodeURIComponent(siteId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not delete this offer. Try again.");
        return;
      }
      invalidateClientFetchCache("/api/blog/site");
      router.push("/offers");
    } catch {
      setError("Could not delete this offer. Try again.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const copyArticle = async (article: SavedRecurringArticle) => {
    try {
      await copyToClipboard(`${article.title}\n\n${htmlToPlainText(article.html)}`);
      setCopiedArticleId(article.id);
      setTimeout(() => setCopiedArticleId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageHeader eyebrow="Offers library" title="Loading offer..." subtitle="" />
        <PageSkeleton cards={2} />
      </div>
    );
  }

  if (notFound || !site) {
    return (
      <div className="page-container">
        <PageHeader
          eyebrow="Offers library"
          title="Offer not found"
          subtitle="This offer may have been deleted."
        />
        <EmptyState
          icon={Globe}
          title="We couldn't find this offer"
          description="Head back to your Offers Library to see everything you've launched."
          action={{ label: "Back to Offers Library", href: "/offers" }}
        />
      </div>
    );
  }

  const territory = getSiteTerritory(site);
  const affiliate = site.armed_links?.[0];
  const createdLabel = formatThreadVersionDate(site.created_at);

  return (
    <div className="page-container">
      <Link
        href="/offers"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-brass-700"
      >
        <ArrowLeft size={15} />
        Offers Library
      </Link>

      <PageHeader eyebrow="Offer" title={site.title} subtitle={site.tagline ?? undefined} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brass-100 px-2.5 py-0.5 text-[13px] font-medium text-brass-700">
          {territory}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[13px] font-medium capitalize ${
            site.status === "live" ? "bg-success/20 text-success" : "bg-black/10 text-text-muted"
          }`}
        >
          {site.status}
        </span>
        {createdLabel && (
          <span className="rounded-full bg-black/10 px-2.5 py-0.5 text-[13px] font-medium text-text-muted">
            Created {createdLabel}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-0.5 text-[13px] font-medium text-text-muted">
          <MousePointerClick size={12} />
          {clicks} click{clicks !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-[var(--mcv-danger)]/20 bg-[var(--mcv-danger)]/10 px-4 py-3 text-sm text-[var(--mcv-danger)]">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <section className="glass-card space-y-2 p-4 sm:p-5">
          <p className="text-[13px] font-medium uppercase tracking-wider text-text-secondary">
            Your links
          </p>
          {siteUrl && (
            <OfferLinkRow icon={Globe} title="Your offer link — share this" url={siteUrl} primary />
          )}
          {affiliate?.url ? (
            <OfferLinkRow
              icon={Link2}
              title={affiliate.label ? `Affiliate link · ${affiliate.label}` : "Affiliate link"}
              url={affiliate.url}
              action={
                <button
                  type="button"
                  onClick={() => setEditingAffiliate(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border-dim bg-white px-2.5 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-[var(--mcv-line-brass)] hover:text-brass-700"
                >
                  <Pencil size={13} />
                  Change
                </button>
              }
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-dim bg-page/40 px-4 py-3">
              <p className="text-sm text-text-muted">No affiliate link on this offer yet.</p>
              <button
                type="button"
                onClick={() => setEditingAffiliate(true)}
                className={QUICK_ACTION_CLASS}
              >
                <Link2 size={14} />
                Add affiliate link
              </button>
            </div>
          )}
        </section>

        <section className="glass-card space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-medium text-text-heading">X story threads</h2>
              <p className="text-sm text-text-secondary">
                Every generation is saved as its own thread, newest first.
              </p>
            </div>
            <button type="button" onClick={toggleThreadGenerator} className="btn-secondary text-sm">
              <Megaphone size={15} />
              {showThreadGenerator
                ? "Hide generator"
                : versions.length > 0
                  ? "Generate new thread"
                  : "Generate story thread"}
            </button>
          </div>

          {showThreadGenerator && kitSite ? <PublishKitPanel site={kitSite} /> : null}

          {!showThreadGenerator && displayVersions.length > 0 ? (
            <div className="space-y-2">
              {displayVersions.map((version) => (
                <ThreadVersionRow
                  key={version.batchId}
                  version={version}
                  name={threadVersionName(version, chronoIndexByBatch.get(version.batchId) ?? 1)}
                  onView={() => setViewerVersion(version)}
                  onDelete={() => setDeletingVersion(version)}
                  onRename={(label) => handleRenameVersion(version.batchId, label)}
                  onTogglePin={() => void handleTogglePin(version)}
                />
              ))}
            </div>
          ) : !showThreadGenerator ? (
            <p className="rounded-xl border border-dashed border-border-dim bg-page/40 px-4 py-3 text-sm text-text-muted">
              No story threads yet. Generate one to get 10 ready-to-post X posts with niche images.
            </p>
          ) : null}
        </section>

        <section className="glass-card space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-medium text-text-heading">Facebook posts</h2>
              <p className="text-sm text-text-secondary">
                Bulk post variants from Social Payouts.
              </p>
            </div>
            <Link
              href={`/social-payouts?siteId=${encodeURIComponent(site.id)}`}
              className="btn-secondary text-sm"
            >
              <MessageSquare size={15} />
              {facebookPosts.length > 0 ? "Generate more posts" : "Generate Facebook posts"}
            </Link>
          </div>

          {facebookPosts.length > 0 ? (
            <ThreadListSection title="Saved posts" count={facebookPosts.length} defaultOpen={false}>
              {facebookPosts.map((post) => (
                <FacebookPostCard key={post.id} post={post} resolvedText={post.body} />
              ))}
            </ThreadListSection>
          ) : (
            <p className="rounded-xl border border-dashed border-border-dim bg-page/40 px-4 py-3 text-sm text-text-muted">
              No Facebook posts saved for this offer yet.
            </p>
          )}
        </section>

        <section className="glass-card space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-medium text-text-heading">Authority articles</h2>
              <p className="text-sm text-text-secondary">
                Long-form articles saved from Done-For-You Profit and Guaranteed High-Ticket Payouts.
              </p>
            </div>
            <Link href="/recurring-wealth" className="btn-secondary text-sm">
              <Repeat size={15} />
              {articles.length > 0 ? "Write more articles" : "Write authority articles"}
            </Link>
          </div>

          {articles.length > 0 ? (
            <ThreadListSection title="Saved articles" count={articles.length} defaultOpen={false}>
              <div className="space-y-2">
                {articles.map((article) => (
                  <details
                    key={article.id}
                    className="group overflow-hidden rounded-xl border border-border-dim bg-white"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                      <ChevronDown
                        size={14}
                        className="shrink-0 text-text-muted transition-transform group-open:rotate-180"
                      />
                      <FileText size={14} className="shrink-0 text-brass-700" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                        {article.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          void copyArticle(article);
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brass-100 px-2.5 py-1 text-[13px] font-medium text-text-secondary hover:bg-brass-100/70"
                      >
                        {copiedArticleId === article.id ? <Check size={12} /> : <ClipboardCopy size={12} />}
                        {copiedArticleId === article.id ? "Copied" : "Copy"}
                      </button>
                    </summary>
                    <div
                      className="recurring-article-body max-h-64 overflow-y-auto border-t border-divider px-4 py-3 text-sm"
                      dangerouslySetInnerHTML={{ __html: sanitizePostHtml(article.html) }}
                    />
                  </details>
                ))}
              </div>
            </ThreadListSection>
          ) : (
            <p className="rounded-xl border border-dashed border-border-dim bg-page/40 px-4 py-3 text-sm text-text-muted">
              No authority articles saved for this offer yet.
            </p>
          )}
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-dim bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-sm font-medium text-text-heading">Delete this offer</h2>
            <p className="text-sm text-text-secondary">
              Removes the sales page and all saved threads, posts, and articles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeletingOffer(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--mcv-danger)]/30 px-3 py-2 text-[13px] font-medium text-[var(--mcv-danger)] transition-colors hover:bg-[var(--mcv-danger)]/10"
          >
            <Trash2 size={14} />
            Delete offer
          </button>
        </section>
      </div>

      <div className="mt-5">
        <Link
          href="/offers"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-brass-700"
        >
          <ArrowRight size={15} className="rotate-180" />
          Back to all offers
        </Link>
      </div>

      <ThreadViewerModal
        open={viewerVersion !== null}
        offerTitle={site.title}
        version={viewerVersion}
        onClose={() => setViewerVersion(null)}
      />

      <LinkEditorOverlay
        open={editingAffiliate}
        initial={affiliate ?? null}
        onSave={handleChangeAffiliate}
        onClose={() => setEditingAffiliate(false)}
      />

      <ConfirmDialog
        open={deletingVersion !== null}
        title="Delete this thread?"
        description={
          deletingVersion
            ? `"${threadVersionName(deletingVersion, chronoIndexByBatch.get(deletingVersion.batchId) ?? 1)}" from ${formatThreadVersionDate(deletingVersion.createdAt)} will be permanently removed. Other threads stay untouched.`
            : ""
        }
        confirmLabel="Delete thread"
        destructive
        loading={deleteBusy}
        onConfirm={() => void handleDeleteVersion()}
        onCancel={() => {
          if (!deleteBusy) setDeletingVersion(null);
        }}
      />

      <ConfirmDialog
        open={deletingOffer}
        title="Delete this offer?"
        description={`"${site.title}" and all saved threads, Facebook posts, and authority articles will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete offer"
        cancelLabel="Keep offer"
        destructive
        loading={deleteBusy}
        onConfirm={() => void handleDeleteOffer()}
        onCancel={() => {
          if (!deleteBusy) setDeletingOffer(false);
        }}
      />
    </div>
  );
}
