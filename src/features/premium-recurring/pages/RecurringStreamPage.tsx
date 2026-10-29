"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Repeat,
  Copy,
  Check,
  Loader2,
  Eye,
  Filter,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { clsx } from "clsx";
import { brand } from "@/config/brand.config";
import { cachedClientFetch } from "@/lib/client-fetch-cache";
import { copyToClipboard } from "@/lib/clipboard";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PremiumVideoTutorial } from "@/components/premium/PremiumVideoTutorial";
import { PremiumStepsSection } from "@/components/premium/PremiumStepsSection";
import { getFeatureThumbnail } from "@/lib/video-thumbnails";
import { GenerationProgress, GENERATION_RESULTS_ID } from "@/components/ui/generation-progress";
import { RECURRING_STREAM_NICHES } from "@/features/premium-recurring/lib/catalog";
import { CrossPlatformGuide } from "@/features/premium-recurring/components/CrossPlatformGuide";
import { wrapArticleWithTitle } from "@/features/blog-builder/lib/authority-article-content";
import { sanitizePostHtml } from "@/features/blog-builder/lib/sanitize-html";
import { getSiteTerritory } from "@/features/blog-builder/lib/site-territory";
import type { SiteVaultSummary } from "@/app/api/blog/site/route";

interface ArticleRow {
  id: number;
  niche: string;
  title: string;
  excerpt: string | null;
  angle: string | null;
}

const PAGE_SIZE = 24;
const SITE_STORAGE_KEY = `${brand.storagePrefix}_recurring_stream_site`;

function formatAngle(angle: string | null): string {
  if (!angle) return "Guide";
  return angle
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function offerLabel(summary: SiteVaultSummary): string {
  const title = summary.site.title || getSiteTerritory(summary.site);
  if (summary.recurringArticleCount > 0) {
    return `${title} (${summary.recurringArticleCount} saved)`;
  }
  return title;
}

export default function RecurringStreamPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [seededCount, setSeededCount] = useState(0);
  const [niche, setNiche] = useState("All");
  const [offers, setOffers] = useState<SiteVaultSummary[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [savedTemplateIds, setSavedTemplateIds] = useState<Set<number>>(new Set());
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [articleHtml, setArticleHtml] = useState<Record<number, string>>({});
  const [loadingAction, setLoadingAction] = useState<{
    articleId: number;
    action: "view" | "copy" | "save";
  } | null>(null);
  const [copiedMode, setCopiedMode] = useState<"text" | "html" | null>(null);
  const [copiedArticleId, setCopiedArticleId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");

  const loadArticles = useCallback(
    async (isInitial = false) => {
      if (isInitial) setInitialLoading(true);
      else setRefreshing(true);
      setError("");
      try {
        const q = niche === "All" ? "" : `?niche=${encodeURIComponent(niche)}`;
        const data = await cachedClientFetch<{
          articles?: ArticleRow[];
          seededCount?: number;
          error?: string;
        }>(`/api/premium/recurring-stream/articles${q}`);
        setArticles(data.articles ?? []);
        setSeededCount(data.seededCount ?? 0);
        setPage(0);
        setPreviewId(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [niche]
  );

  const loadOffers = useCallback(async () => {
    const data = await cachedClientFetch<{ summaries?: SiteVaultSummary[]; error?: string }>(
      "/api/blog/site?lite=1"
    );
    const list = Array.isArray(data.summaries) ? (data.summaries as SiteVaultSummary[]) : [];
    setOffers(list);

    if (list.length === 0) return;

    let fromStorage: string | null = null;
    try {
      fromStorage = localStorage.getItem(SITE_STORAGE_KEY);
    } catch {
      /* ignore */
    }

    const preferred =
      fromStorage && list.some((o) => o.site.id === fromStorage) ? fromStorage : list[0].site.id;
    setSelectedSiteId(preferred);
  }, []);

  const loadSavedForOffer = useCallback(async (siteId: string) => {
    if (!siteId) {
      setSavedTemplateIds(new Set());
      setArticleHtml({});
      return;
    }

    try {
      const res = await fetch(`/api/blog/site?siteId=${encodeURIComponent(siteId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;

      const saved = Array.isArray(data.recurringArticles) ? data.recurringArticles : [];
      const ids = new Set<number>(saved.map((row: { template_id: number }) => row.template_id));
      setSavedTemplateIds(ids);

      const htmlMap: Record<number, string> = {};
      for (const row of saved) {
        htmlMap[row.template_id] = row.html;
      }
      setArticleHtml(htmlMap);
    } catch {
      setSavedTemplateIds(new Set());
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([loadArticles(true), loadOffers()]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setInitialLoading(false);
      }
    })();
  }, [loadArticles, loadOffers]);

  useEffect(() => {
    if (!selectedSiteId) return;
    try {
      localStorage.setItem(SITE_STORAGE_KEY, selectedSiteId);
    } catch {
      /* ignore */
    }
    setPreviewId(null);
    void loadSavedForOffer(selectedSiteId);
  }, [selectedSiteId, loadSavedForOffer]);

  const selectedOffer = useMemo(
    () => offers.find((o) => o.site.id === selectedSiteId),
    [offers, selectedSiteId]
  );

  const pageCount = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const paged = useMemo(
    () => articles.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [articles, page]
  );

  const previewArticle = previewId != null ? articles.find((a) => a.id === previewId) : null;

  const loadArticlePreview = async (
    articleId: number,
    action: "view" | "copy"
  ): Promise<string | null> => {
    if (!selectedSiteId) {
      setError("Select an offer before continuing.");
      return null;
    }
    if (articleHtml[articleId]) {
      setError("");
      return articleHtml[articleId];
    }

    setLoadingAction({ articleId, action });
    setError("");
    try {
      const params = new URLSearchParams({
        articleId: String(articleId),
        siteId: selectedSiteId,
      });
      const res = await fetch(`/api/premium/recurring-stream/articles?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load preview");
      setArticleHtml((prev) => ({ ...prev, [articleId]: data.html }));
      return data.html as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load preview");
      return null;
    } finally {
      setLoadingAction(null);
    }
  };

  const saveArticleToOffer = async (articleId: number): Promise<boolean> => {
    if (!selectedSiteId) {
      setError("Select an offer before continuing.");
      return false;
    }
    if (savedTemplateIds.has(articleId)) {
      setError("");
      return true;
    }

    setLoadingAction({ articleId, action: "save" });
    setError("");
    try {
      const res = await fetch("/api/premium/recurring-stream/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, siteId: selectedSiteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save article");

      setArticleHtml((prev) => ({ ...prev, [articleId]: data.html }));
      setSavedTemplateIds((prev) => new Set([...prev, articleId]));
      setOffers((prev) =>
        prev.map((o) =>
          o.site.id === selectedSiteId
            ? { ...o, recurringArticleCount: o.recurringArticleCount + 1 }
            : o
        )
      );
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save article");
      return false;
    } finally {
      setLoadingAction(null);
    }
  };

  const openPreview = async (articleId: number) => {
    if (previewId === articleId) {
      setPreviewId(null);
      return;
    }
    const html = await loadArticlePreview(articleId, "view");
    if (html) setPreviewId(articleId);
  };

  const applyTemplate = async (articleId: number) => {
    const saved = await saveArticleToOffer(articleId);
    if (!saved) return;

    if (previewId !== articleId) {
      const html = articleHtml[articleId] ?? (await loadArticlePreview(articleId, "view"));
      if (html) setPreviewId(articleId);
    }
  };

  const copyArticleFromCard = async (articleId: number) => {
    const html = await loadArticlePreview(articleId, "copy");
    const article = articles.find((a) => a.id === articleId);
    if (!html || !article) return;

    const exportHtml = wrapArticleWithTitle(article.title, html);
    const payload = `${article.title}\n\n${htmlToPlainText(exportHtml)}`;
    await copyToClipboard(payload);
    setCopiedArticleId(articleId);
    setTimeout(() => setCopiedArticleId(null), 2000);
  };

  const copyArticle = async (mode: "text" | "html") => {
    if (previewId == null) return;
    const html = articleHtml[previewId];
    const article = articles.find((a) => a.id === previewId);
    if (!html || !article) return;

    const exportHtml = wrapArticleWithTitle(article.title, html);
    const payload =
      mode === "html"
        ? exportHtml
        : `${article.title}\n\n${htmlToPlainText(exportHtml)}`;

    await copyToClipboard(payload);
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode(null), 2000);
  };

  if (initialLoading && articles.length === 0) {
    return (
      <div className="page-container">
        <PageHeader
          eyebrow="Premium"
          title="Guaranteed High-Ticket Payouts"
          subtitle={`${seededCount || 100} long-form authority articles — pick an offer, preview with your link, and publish across platforms.`}
        />
        <PageSkeleton cards={2} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-container"
    >
      <PageHeader
        eyebrow="Premium"
        title="Guaranteed High-Ticket Payouts"
        subtitle={`${seededCount} of 100 long-form authority articles (1,000+ words each) — pick an offer, preview with your link, and publish across platforms.`}
      />

      <div className="mb-4">
        <PremiumVideoTutorial
          vimeoId="1215568587"
          title="Guaranteed High-Ticket Payouts Training"
          description="Watch how to pick an authority article template, preview it with your offer link inside, and publish it on Medium, LinkedIn, or your own blog."
          iframeTitle="Guaranteed High-Ticket Payouts training video"
          thumbnailSrc={getFeatureThumbnail("guaranteed-high-ticket")}
        />
      </div>

      <div className="mb-4">
        <PremiumStepsSection
          steps={[
            {
              num: "1",
              title: "Pick an offer",
              desc: "Choose which sales page the articles should promote — your link is placed inside automatically.",
            },
            {
              num: "2",
              title: "Preview an article",
              desc: "Browse 100 long-form authority articles by niche and preview any template with your link inside.",
            },
            {
              num: "3",
              title: "Publish anywhere",
              desc: "Copy the article to Medium, LinkedIn, or your blog. Saved articles stay linked to your offer.",
            },
          ]}
        />
      </div>

      <section className="glass-card overflow-hidden p-0">
        <div className="border-b border-divider bg-brass-100 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brass-100 text-brass-700">
                <Repeat size={24} />
              </div>
              <div>
                <p className="font-medium text-text-primary">100 Authority Articles</p>
                <p className="text-sm text-text-secondary">
                  SEO-ready articles with intro, sections, FAQs, and CTAs — preview first, then use a template to save it to your offer.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6 md:p-8">
          {offers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--mcv-line-brass)] p-6 text-center">
              <FolderOpen className="mx-auto mb-2 text-text-muted" size={28} />
              <p className="text-sm text-text-secondary">
                Create an offer first, then personalize and save authority articles to it.
              </p>
              <Link href="/sales-offer-generator" className="btn-primary mt-4 inline-flex">
                Create an offer
              </Link>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Select offer</span>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="input-base w-full"
                >
                  {offers.map((o) => (
                    <option key={o.site.id} value={o.site.id}>
                      {offerLabel(o)}
                    </option>
                  ))}
                </select>
              </label>

              {selectedOffer && (
                <p className="text-xs text-text-muted">
                  Niche: {getSiteTerritory(selectedOffer.site)}
                  {selectedOffer.site.armed_links?.[0]?.url
                    ? " · Affiliate link armed"
                    : " · Add a link in Sales Offer Generator for best results"}
                  {selectedOffer.recurringArticleCount > 0
                    ? ` · ${selectedOffer.recurringArticleCount} article${selectedOffer.recurringArticleCount !== 1 ? "s" : ""} saved`
                    : ""}
                </p>
              )}

              {selectedSiteId && selectedOffer?.site.armed_links?.[0]?.url && (
                <p className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm font-medium text-success">
                  <Sparkles size={14} className="shrink-0 text-success" />
                  Offer selected — previews include your affiliate link. Use a template to save the article to this offer.
                </p>
              )}
            </>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-text-muted" />
            {["All", ...RECURRING_STREAM_NICHES].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNiche(n)}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  niche === n
                    ? "bg-grad-brass text-black"
                    : "bg-brass-100 text-text-secondary hover:bg-brass-100/70"
                )}
              >
                {n}
              </button>
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-[var(--mcv-danger)]/20 bg-[var(--mcv-danger)]/10 px-3 py-2.5 text-sm font-medium text-[var(--mcv-danger)]"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--mcv-danger)]" aria-hidden />
              {error}
            </p>
          )}
        </div>
      </section>

      <CrossPlatformGuide />

      <GenerationProgress
        active={loadingAction !== null}
        label={
          loadingAction?.action === "save"
            ? "Saving article to your offer..."
            : "Loading article preview..."
        }
      />

      <AnimatePresence>
        {previewArticle && articleHtml[previewArticle.id] && (
          <motion.section
            id={GENERATION_RESULTS_ID}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card overflow-hidden border-[var(--mcv-line-brass)] scroll-mt-24"
          >
            <div className="flex items-start justify-between gap-3 border-b border-divider p-4 md:p-5">
              <div className="min-w-0">
                <p className="text-[13px] font-medium uppercase tracking-wider text-brass-700">
                  {previewArticle.niche}
                </p>
                <h2 className="mt-1 font-medium text-text-primary">{previewArticle.title}</h2>
                <span className="mt-2 inline-block rounded-full bg-brass-100 px-2 py-0.5 text-[13px] font-medium text-text-muted">
                  {formatAngle(previewArticle.angle)}
                </span>
                {savedTemplateIds.has(previewArticle.id) && (
                  <span className="ml-2 inline-block rounded-full bg-success/15 px-2 py-0.5 text-[13px] font-medium text-success">
                    Saved to offer
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                className="rounded-lg p-2 text-text-muted hover:bg-brass-100 hover:text-text-primary"
                aria-label="Close preview"
              >
                <X size={16} />
              </button>
            </div>
            <div
              className="recurring-article-body max-h-[min(70vh,720px)] max-w-none overflow-y-auto bg-white px-5 py-6 md:px-8 md:py-8"
              dangerouslySetInnerHTML={{
                __html: sanitizePostHtml(
                  wrapArticleWithTitle(previewArticle.title, articleHtml[previewArticle.id]),
                ),
              }}
            />
            <div className="flex flex-wrap gap-2 border-t border-divider p-4 md:p-5">
              {!savedTemplateIds.has(previewArticle.id) ? (
                <button
                  type="button"
                  disabled={loadingAction?.articleId === previewArticle.id}
                  onClick={() => void applyTemplate(previewArticle.id)}
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                >
                  {loadingAction?.articleId === previewArticle.id && loadingAction.action === "save" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  Use this template
                </button>
              ) : (
                <Link
                  href="/offers"
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                >
                  <FolderOpen size={14} />
                  View in Offers Library
                </Link>
              )}
              <button
                type="button"
                onClick={() => void copyArticle("text")}
                className="inline-flex items-center gap-2 rounded-lg border border-border-dim bg-brass-100 px-4 py-2 text-sm font-medium text-text-primary hover:bg-brass-100/70"
              >
                {copiedMode === "text" ? <Check size={14} /> : <Copy size={14} />}
                {copiedMode === "text" ? "Copied!" : "Copy article (plain text)"}
              </button>
              <button
                type="button"
                onClick={() => void copyArticle("html")}
                className="inline-flex items-center gap-2 rounded-lg border border-border-dim bg-brass-100 px-4 py-2 text-sm font-medium text-text-primary hover:bg-brass-100/70"
              >
                {copiedMode === "html" ? <Check size={14} /> : <Copy size={14} />}
                {copiedMode === "html" ? "Copied!" : "Copy article (HTML)"}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className={clsx("space-y-4", refreshing && "opacity-60 pointer-events-none")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-text-secondary">
            {articles.length} article{articles.length !== 1 ? "s" : ""}
            {niche !== "All" ? ` in ${niche}` : ""}
          </p>
          {refreshing && (
            <span className="inline-flex items-center gap-2 text-xs text-text-muted">
              <Loader2 size={12} className="animate-spin" />
              Updating…
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((article) => (
            <article
              key={article.id}
              className={clsx(
                "glass-card flex flex-col gap-3 p-4 transition-colors hover:border-[var(--mcv-line-brass)]",
                previewId === article.id && "border-[var(--mcv-line-brass)]"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-medium uppercase tracking-wider text-brass-700">
                    {article.niche}
                  </p>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded bg-brass-100 px-2 py-0.5 text-[13px] text-text-muted">
                      {formatAngle(article.angle)}
                    </span>
                    {savedTemplateIds.has(article.id) && (
                      <span className="rounded bg-success/15 px-2 py-0.5 text-[13px] font-medium text-success">
                        Saved
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="mt-1 line-clamp-2 font-medium text-text-primary">{article.title}</h3>
                {article.excerpt && (
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-text-secondary">
                    {article.excerpt}
                  </p>
                )}
              </div>
              <div className="mt-auto flex flex-col gap-2">
                <button
                  type="button"
                  disabled={loadingAction?.articleId === article.id || !selectedSiteId}
                  onClick={() => void openPreview(article.id)}
                  className="btn-secondary inline-flex w-full items-center justify-center gap-2 text-sm disabled:opacity-40"
                >
                  {loadingAction?.articleId === article.id && loadingAction.action === "view" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Eye size={14} />
                  )}
                  {previewId === article.id ? "Close" : "View"}
                </button>
                <button
                  type="button"
                  disabled={
                    loadingAction?.articleId === article.id ||
                    !selectedSiteId ||
                    savedTemplateIds.has(article.id)
                  }
                  onClick={() => void applyTemplate(article.id)}
                  className="btn-primary inline-flex w-full items-center justify-center gap-2 text-sm disabled:opacity-40"
                >
                  {loadingAction?.articleId === article.id && loadingAction.action === "save" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : savedTemplateIds.has(article.id) ? (
                    <Check size={14} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {savedTemplateIds.has(article.id) ? "Saved to offer" : "Use this template"}
                </button>
                <button
                  type="button"
                  disabled={loadingAction?.articleId === article.id || !selectedSiteId}
                  onClick={() => void copyArticleFromCard(article.id)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-dim bg-brass-100 px-3 py-2 text-sm font-medium text-text-primary hover:bg-brass-100/70 disabled:opacity-40"
                >
                  {loadingAction?.articleId === article.id && loadingAction.action === "copy" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : copiedArticleId === article.id ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copiedArticleId === article.id ? "Copied!" : "Copy"}
                </button>
              </div>
            </article>
          ))}
        </div>

        {articles.length === 0 && !initialLoading && (
          <p className="text-center text-sm text-text-muted">No articles in this niche yet.</p>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-border-dim px-3 py-1.5 text-sm text-text-secondary disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <span className="text-xs text-text-muted">
              Page {page + 1} of {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-border-dim px-3 py-1.5 text-sm text-text-secondary disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted">
        Powered by {brand.productName}. Use a template to save articles to your offer — view them anytime in Offers Library.
      </p>
    </motion.div>
  );
}
