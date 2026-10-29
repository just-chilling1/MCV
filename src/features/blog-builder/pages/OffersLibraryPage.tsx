"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Copy,
  Check,
  Eye,
  FolderOpen,
  Globe,
  Loader2,
  MousePointerClick,
  Search,
  Trash2,
} from "lucide-react";
import { getAppUrl } from "@/lib/brand-vars";
import { copyToClipboard } from "@/lib/clipboard";
import { sitePublicPath } from "@/lib/app-url";
import { cachedClientFetch, invalidateClientFetchCache } from "@/lib/client-fetch-cache";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ThreadViewerModal } from "@/features/publish-kit/components/ThreadViewerModal";
import {
  groupThreadsIntoVersions,
  preferredVersion,
  type ThreadVersion,
} from "@/features/publish-kit/lib/thread-batches";
import { getSiteTerritory } from "@/features/blog-builder/lib/site-territory";
import type { SiteVaultSummary } from "@/app/api/blog/site/route";
import type { SavedXThread } from "@/features/publish-kit/lib/x-threads-vault";

const QUICK_ACTION_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-border-dim bg-white px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:border-[var(--mcv-line-brass)] hover:text-brass-700";

function CopyUrlAction({ url }: { url: string }) {
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
    <button type="button" onClick={() => void handleCopy()} className={QUICK_ACTION_CLASS}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}

function OfferCard({
  summary,
  siteUrl,
  loadingThread,
  onViewThread,
  onDeleteRequest,
}: {
  summary: SiteVaultSummary;
  siteUrl: string;
  loadingThread: boolean;
  onViewThread: () => void;
  onDeleteRequest: () => void;
}) {
  const { site, xThreadCount = 0, facebookPostCount = 0, recurringArticleCount = 0 } = summary;
  const territory = getSiteTerritory(site);
  const detailHref = `/offers/${encodeURIComponent(site.id)}`;

  return (
    <article className="glass-card overflow-hidden">
      <Link
        href={detailHref}
        className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-canvas"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brass-100 text-brass-700">
          <FolderOpen size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="brand-font text-lg text-text-heading">{site.title}</h3>
          {site.tagline && (
            <p className="mt-0.5 text-sm text-text-secondary line-clamp-2">{site.tagline}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-brass-100 px-2 py-0.5 text-[13px] font-medium text-brass-700">
              {territory}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[13px] font-medium capitalize ${
                site.status === "live" ? "bg-success/20 text-success" : "bg-black/10 text-text-muted"
              }`}
            >
              {site.status}
            </span>
            {xThreadCount > 0 && (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[13px] font-medium text-text-muted">
                {xThreadCount} thread{xThreadCount !== 1 ? "s" : ""}
              </span>
            )}
            {facebookPostCount > 0 && (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[13px] font-medium text-text-muted">
                {facebookPostCount} Facebook post{facebookPostCount !== 1 ? "s" : ""}
              </span>
            )}
            {recurringArticleCount > 0 && (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[13px] font-medium text-text-muted">
                {recurringArticleCount} article{recurringArticleCount !== 1 ? "s" : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-2 py-0.5 text-[13px] font-medium text-text-muted">
              <MousePointerClick size={12} />
              {summary.clickCount} click{summary.clickCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <ArrowRight size={18} className="mt-1 shrink-0 text-text-muted" />
      </Link>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border-dim/70 px-5 py-3">
        <Link
          href={detailHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--mcv-line-brass)] bg-brass-100 px-3 py-2 text-[13px] font-medium text-brass-700 transition-colors hover:bg-brass-100/70"
        >
          <Globe size={14} />
          View offer
        </Link>
        {siteUrl && <CopyUrlAction url={siteUrl} />}
        {xThreadCount > 0 && (
          <button
            type="button"
            onClick={onViewThread}
            disabled={loadingThread}
            className={QUICK_ACTION_CLASS}
          >
            {loadingThread ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            View thread
          </button>
        )}
        <button
          type="button"
          onClick={onDeleteRequest}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-text-muted transition-colors hover:bg-[var(--mcv-danger)]/10 hover:text-[var(--mcv-danger)]"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </article>
  );
}

export default function OffersLibraryPage() {
  const [summaries, setSummaries] = useState<SiteVaultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft">("all");
  const [threadsBySite, setThreadsBySite] = useState<Record<string, SavedXThread[]>>({});
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ title: string; version: ThreadVersion } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SiteVaultSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    void cachedClientFetch<{ summaries?: SiteVaultSummary[] }>("/api/blog/site?lite=1")
      .then((data) => {
        setSummaries(Array.isArray(data.summaries) ? data.summaries : []);
      })
      .catch(() => setSummaries([]))
      .finally(() => setLoading(false));
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : getAppUrl();

  const siteUrls = useMemo(() => {
    const map: Record<string, string> = {};
    for (const summary of summaries) {
      map[summary.site.id] = `${origin}${sitePublicPath(summary.site)}`;
    }
    return map;
  }, [summaries, origin]);

  const filteredSummaries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summaries.filter((summary) => {
      if (statusFilter !== "all" && summary.site.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        summary.site.title,
        summary.site.tagline ?? "",
        getSiteTerritory(summary.site),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [summaries, query, statusFilter]);

  const handleViewThread = async (summary: SiteVaultSummary) => {
    const siteId = summary.site.id;
    let threads = threadsBySite[siteId];

    if (!threads) {
      setLoadingThreadId(siteId);
      try {
        const res = await fetch(`/api/blog/site?siteId=${encodeURIComponent(siteId)}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        threads = Array.isArray(data.xThreads) ? (data.xThreads as SavedXThread[]) : [];
        setThreadsBySite((prev) => ({ ...prev, [siteId]: threads! }));
      } finally {
        setLoadingThreadId(null);
      }
    }

    const version = preferredVersion(groupThreadsIntoVersions(threads ?? []));
    if (version) {
      setViewer({ title: summary.site.title, version });
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(
        `/api/blog/site?siteId=${encodeURIComponent(pendingDelete.site.id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error ?? "Could not delete this offer. Please try again.");
        return;
      }

      const deletedId = pendingDelete.site.id;
      setSummaries((prev) => prev.filter((s) => s.site.id !== deletedId));
      setThreadsBySite((prev) => {
        const next = { ...prev };
        delete next[deletedId];
        return next;
      });
      invalidateClientFetchCache("/api/blog/site");
      setPendingDelete(null);
    } catch {
      setDeleteError("Could not delete this offer. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageHeader
          eyebrow="Offers library"
          title="Your generated sales offers"
          subtitle="Every launched sales page lives here with its saved threads, Facebook posts, and authority articles."
        />
        <PageSkeleton cards={2} />
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="page-container">
        <PageHeader
          eyebrow="Offers library"
          title="Your generated sales offers"
          subtitle="Every launched sales page lives here with its saved threads, Facebook posts, and authority articles."
        />
        <EmptyState
          icon={FolderOpen}
          title="No offers yet"
          description="Run the Sales Offer Generator to create your first sales page, then come back here to view it and its X threads."
          action={{ label: "Start Sales Offer Generator", href: "/sales-offer-generator" }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Offers library"
        title="Your generated sales offers"
        subtitle="Open an offer to see its links, story threads, and saved content — or use the quick actions below each card."
      />

      {deleteError ? (
        <p className="mb-4 rounded-xl border border-[var(--mcv-danger)]/20 bg-[var(--mcv-danger)]/10 px-4 py-3 text-sm text-[var(--mcv-danger)]">
          {deleteError}
        </p>
      ) : null}

      {summaries.length >= 2 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search offers by name or niche..."
              aria-label="Search offers"
              className="input-base w-full pl-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(["all", "live", "draft"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? "bg-grad-brass text-black"
                    : "border border-border-dim bg-white text-text-secondary hover:border-[var(--mcv-line-brass)] hover:text-brass-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredSummaries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-dim bg-page/40 px-4 py-6 text-center text-sm text-text-muted">
          No offers match your search. Try a different name or clear the filters.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredSummaries.map((summary) => (
            <OfferCard
              key={summary.site.id}
              summary={summary}
              siteUrl={siteUrls[summary.site.id] ?? ""}
              loadingThread={loadingThreadId === summary.site.id}
              onViewThread={() => void handleViewThread(summary)}
              onDeleteRequest={() => {
                setDeleteError(null);
                setPendingDelete(summary);
              }}
            />
          ))}
        </div>
      )}

      <ThreadViewerModal
        open={viewer !== null}
        offerTitle={viewer?.title ?? ""}
        version={viewer?.version ?? null}
        onClose={() => setViewer(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this offer?"
        description={
          pendingDelete
            ? `"${pendingDelete.site.title}" and all saved threads, Facebook posts, and authority articles will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete offer"
        cancelLabel="Keep offer"
        destructive
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          if (!deleting) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
