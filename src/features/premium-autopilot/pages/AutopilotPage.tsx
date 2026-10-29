"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Lightbulb,
  Link2,
  PenLine,
  Send,
} from "lucide-react";
import { clsx } from "clsx";
import { PremiumPageLayout } from "@/components/premium/PremiumPageLayout";
import { PremiumVideoTutorial } from "@/components/premium/PremiumVideoTutorial";
import { PremiumStepsSection } from "@/components/premium/PremiumStepsSection";
import { PremiumFooter } from "@/components/premium/PremiumFooter";
import { getFeatureThumbnail } from "@/lib/video-thumbnails";
import { AffiliateLinkField } from "@/components/premium/AffiliateLinkField";
import { SourceCard } from "@/features/premium-autopilot/components/SourceCard";
import { SourceInstructionsOverlay } from "@/features/premium-autopilot/components/SourceInstructionsOverlay";
import {
  NICHES,
  filterSourcesByNiche,
  resolveAutopilotNiche,
  SOURCES,
} from "@/features/premium-autopilot/lib/traffic-sources";
import {
  deriveCraftPromotionDefaults,
  fetchAutopilotState,
  fetchCraftArticles,
  migrateLegacyCompletions,
  saveAutopilotSettings,
  setAutopilotCompletion,
} from "@/features/premium-autopilot/lib/autopilot-client";
import { useAppStore } from "@/store";
import type { Article } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/clipboard";

const PAGE_SIZE = 24;
const LINK_PLACEHOLDER = "[YOUR_LINK]";
const ARTICLE_PICKER_LIMIT = 8;

function renderSourceCopy(template: string, pageUrl: string) {
  return template.replaceAll("{LINK}", pageUrl || LINK_PLACEHOLDER);
}

function cleanArticleTitle(title: string) {
  return title.replace(/^e\.g\.\s*,?\s*/i, "").trim() || title;
}

export default function AutomatedProfitsPage() {
  const storeArticles = useAppStore((s) => s.articles);
  const setArticles = useAppStore((s) => s.setArticles);
  const { toast } = useToast();

  const [selectedNiche, setSelectedNiche] = useState("All");
  const [pageUrl, setPageUrl] = useState("");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedDescId, setCopiedDescId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [hydrated, setHydrated] = useState(false);
  const [craftArticles, setCraftArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const lastSavedUrl = useRef<string | null>(null);
  const lastSavedNiche = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [initialState, articles] = await Promise.all([
        fetchAutopilotState(),
        fetchCraftArticles(),
      ]);
      const state = await migrateLegacyCompletions(initialState);
      if (cancelled) return;

      if (articles.length > 0) {
        setCraftArticles(articles);
        setArticles(articles);
      } else if (storeArticles.length > 0) {
        setCraftArticles(storeArticles);
      }

      const craft = deriveCraftPromotionDefaults(
        articles.length > 0 ? articles : storeArticles
      );

      const savedUrl = state?.promotion_url?.trim() ?? "";
      if (savedUrl) {
        setPageUrl(savedUrl);
        lastSavedUrl.current = savedUrl;
      } else if (craft?.promotionUrl) {
        setPageUrl(craft.promotionUrl);
        lastSavedUrl.current = craft.promotionUrl;
      }

      if (craft?.articleId) setSelectedArticleId(craft.articleId);

      const savedNiche = resolveAutopilotNiche(state?.selected_niche);
      const hasSavedNiche = savedNiche !== "All";
      const defaultNiche = hasSavedNiche
        ? savedNiche
        : craft?.niche && craft.niche !== "All"
          ? craft.niche
          : "All";
      setSelectedNiche(defaultNiche);
      if (hasSavedNiche) lastSavedNiche.current = savedNiche;

      if (state?.completed_source_ids?.length) {
        setCompleted(new Set(state.completed_source_ids));
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // Hydrate once on mount — storeArticles used only as empty fallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const trimmed = pageUrl.trim();
    if (lastSavedUrl.current === trimmed) return;
    const previous = lastSavedUrl.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        const ok = await saveAutopilotSettings({
          promotion_url: trimmed || null,
        });
        if (ok) {
          lastSavedUrl.current = trimmed;
          return;
        }
        setPageUrl(previous ?? "");
        toast("Could not save promotion URL.", { variant: "error" });
      })();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [pageUrl, hydrated, toast]);

  const handleNicheChange = useCallback(
    async (niche: string) => {
      if (niche === selectedNiche) return;
      const previous = selectedNiche;
      setSelectedNiche(niche);
      setVisibleCount(PAGE_SIZE);
      setExpandedId(null);
      if (!hydrated) return;
      if (lastSavedNiche.current === niche) return;
      const ok = await saveAutopilotSettings({ selected_niche: niche });
      if (ok) {
        lastSavedNiche.current = niche;
        return;
      }
      setSelectedNiche(previous);
      toast("Could not save niche.", { variant: "error" });
    },
    [selectedNiche, hydrated, toast]
  );

  const handleSelectArticle = useCallback(
    (articleId: string) => {
      if (!articleId) {
        setSelectedArticleId(null);
        return;
      }
      const article = craftArticles.find((a) => a.id === articleId);
      if (!article) {
        setSelectedArticleId(null);
        return;
      }
      setSelectedArticleId(article.id);
      if (article.affiliate_link?.trim()) {
        setPageUrl(article.affiliate_link.trim());
      }
      const niche = resolveAutopilotNiche(article.niche);
      if (niche !== "All") void handleNicheChange(niche);
    },
    [craftArticles, handleNicheChange]
  );

  const toggleCompleted = useCallback(
    async (id: string) => {
      const wasDone = completed.has(id);
      const nextDone = !wasDone;

      setCompleted((prev) => {
        const next = new Set(prev);
        if (nextDone) next.add(id);
        else next.delete(id);
        return next;
      });

      if (!hydrated) return;

      const ok = await setAutopilotCompletion(id, nextDone);
      if (!ok) {
        setCompleted((prev) => {
          const rollback = new Set(prev);
          if (wasDone) rollback.add(id);
          else rollback.delete(id);
          return rollback;
        });
      }
    },
    [completed, hydrated]
  );

  const filteredSources = useMemo(
    () => filterSourcesByNiche(selectedNiche),
    [selectedNiche]
  );

  const visibleSources = useMemo(
    () => filteredSources.slice(0, visibleCount),
    [filteredSources, visibleCount]
  );

  const completedCount = useMemo(
    () => filteredSources.filter((s) => completed.has(s.id)).length,
    [filteredSources, completed]
  );

  const progressPercent =
    filteredSources.length > 0
      ? Math.round((completedCount / filteredSources.length) * 100)
      : 0;

  const hasMore = visibleCount < filteredSources.length;
  const selectedSource =
    SOURCES.find((source) => source.id === expandedId) ?? null;

  return (
    <PremiumPageLayout
      title="Automated Profits"
      subtitle="Drive traffic to the affiliate links and Craft articles you already built — 180 practical sources across nine niches."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/write" className="btn-secondary">
            <PenLine size={14} />
            Craft
          </Link>
          <Link href="/publish" className="btn-secondary">
            <Send size={14} />
            Broadcast
          </Link>
        </div>
      }
      footer={<PremiumFooter />}
    >
      <PremiumVideoTutorial
        vimeoId="1171734563"
        iframeTitle="Automated Profits Tutorial"
        title="How to Use Automated Profits"
        description="Pick a Craft article or Links Library URL, filter by niche, then share where your offer genuinely helps."
        thumbnailSrc={getFeatureThumbnail("automated-profits")}
      />

      <nav
        aria-label="Core workflow"
        className="flex flex-wrap items-center gap-2 rounded-xl border border-border-dim bg-surface px-4 py-3 text-sm"
      >
        <Link
          href="/write"
          className="inline-flex items-center gap-1.5 font-medium text-brass-700 transition-colors hover:text-success"
        >
          <PenLine size={14} />
          Craft
        </Link>
        <ChevronRight size={14} className="text-text-muted" aria-hidden />
        <Link
          href="/link-vault"
          className="inline-flex items-center gap-1.5 font-medium text-brass-700 transition-colors hover:text-success"
        >
          <Link2 size={14} />
          Links
        </Link>
        <ChevronRight size={14} className="text-text-muted" aria-hidden />
        <span className="inline-flex items-center gap-1.5 font-medium text-text-heading">
          <BookOpen size={14} className="text-success" />
          Autopilot
        </span>
        <ChevronRight size={14} className="text-text-muted" aria-hidden />
        <Link
          href="/publish"
          className="inline-flex items-center gap-1.5 font-medium text-brass-700 transition-colors hover:text-success"
        >
          <Send size={14} />
          Broadcast
        </Link>
      </nav>

      <PremiumStepsSection
        title="How This Works"
        steps={[
          {
            num: "1",
            title: "Use Your Craft Assets",
            desc: "Select a Craft article or a link from your Links Library — Autopilot promotes what you already generated.",
          },
          {
            num: "2",
            title: "Match the Niche",
            desc: "Filter traffic sources to the same niche as your article so every post fits the audience.",
          },
          {
            num: "3",
            title: "Share & Track",
            desc: "Follow each source’s steps, paste your link where it helps, and mark sources done as you go.",
          },
        ]}
      />

      <div className="flex items-start gap-3 rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 p-5">
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-success" />
        <div>
          <span className="text-sm font-medium text-success">Pro tip: </span>
          <span className="text-sm text-text-secondary">
            Start with communities where your Craft article answers a real question.
            Read the rules first — only share your link when it supports your reply.
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-8">
        <div className="glass-card flex flex-col gap-7 p-6 sm:gap-8 sm:p-8">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-medium text-text-heading">
              Promote from Craft
            </h3>
            <p className="text-sm text-text-muted">
              Choose an article you generated — we pull its niche and affiliate link.
              Or paste any URL from your Links Library below.
            </p>
          </div>

          {craftArticles.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Craft article
                </span>
                <span className="text-xs text-text-muted">
                  {craftArticles.length} saved
                </span>
              </div>
              <div
                role="listbox"
                aria-label="Craft articles"
                className="max-h-64 space-y-2 overflow-y-auto pr-1"
              >
                {craftArticles.slice(0, ARTICLE_PICKER_LIMIT).map((article) => {
                  const selected = selectedArticleId === article.id;
                  const niche = article.niche?.trim();
                  const hasLink = Boolean(article.affiliate_link?.trim());
                  return (
                    <button
                      key={article.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() =>
                        handleSelectArticle(selected ? "" : article.id)
                      }
                      className={clsx(
                        "select-card flex w-full items-start gap-3 !rounded-2xl p-3.5 text-left",
                        selected && "is-selected"
                      )}
                    >
                      <FileText
                        size={16}
                        className={clsx(
                          "mt-0.5 shrink-0",
                          selected ? "text-success" : "text-text-muted"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={clsx(
                            "select-card-label line-clamp-2",
                            selected && "font-medium text-success"
                          )}
                        >
                          {cleanArticleTitle(article.title)}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {niche ? (
                            <span className="rounded-full border border-[var(--mcv-line-brass)] bg-brass-100 px-2 py-0.5 text-[11px] font-medium text-brass-700">
                              {niche}
                            </span>
                          ) : null}
                          <span className="text-[11px] text-text-muted">
                            {article.status === "published" ? "Published" : "Draft"}
                            {hasLink ? " · Link ready" : ""}
                          </span>
                        </div>
                      </div>
                      {selected ? (
                        <span className="select-check-badge shrink-0" aria-hidden>
                          <Check size={18} strokeWidth={3} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {craftArticles.length > ARTICLE_PICKER_LIMIT ? (
                <Link
                  href="/vault"
                  className="text-xs font-medium text-brass-700 hover:text-success"
                >
                  View all {craftArticles.length} articles in Vault →
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border-dim bg-field px-4 py-6 text-sm text-text-secondary">
              No Craft articles yet.{" "}
              <Link href="/write" className="auth-link font-medium">
                Generate one in Craft
              </Link>{" "}
              or add a link in your{" "}
              <Link href="/link-vault" className="auth-link font-medium">
                Links Library
              </Link>
              .
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-border-dim pt-7">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium text-text-heading">
                Promotion URL
              </h4>
              <p className="text-xs text-text-muted">
                Pick from Links Library or paste a URL — inserted into every source
                description as you copy.
              </p>
            </div>
            <AffiliateLinkField
              value={pageUrl}
              onChange={setPageUrl}
              inputId="autopilot-promotion-url"
              placeholder="https://your-affiliate-or-article-link.com"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {NICHES.map((niche) => (
            <button
              key={niche}
              type="button"
              onClick={() => void handleNicheChange(niche)}
              className={clsx(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                selectedNiche === niche
                  ? "border-[var(--mcv-line-brass)] bg-brass-500 text-white shadow-[var(--mcv-shadow-brass)]"
                  : "border-border-dim bg-surface text-text-secondary hover:border-[var(--mcv-line-brass)] hover:text-text-heading"
              )}
            >
              {niche}
            </button>
          ))}
        </div>

        <div className="glass-card flex flex-col gap-3 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-medium text-text-heading">
                Your progress
              </h3>
              <p className="text-sm text-text-secondary">
                {completedCount} of {filteredSources.length} sources completed
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-medium text-success">
                {progressPercent}%
              </span>
              <p className="text-xs text-text-muted">Complete</p>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-field">
            <motion.div
              className="h-full rounded-full bg-brass-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {visibleSources.map((source, idx) => (
            <SourceCard
              key={source.id}
              source={source}
              isDone={completed.has(source.id)}
              index={idx}
              onView={() => setExpandedId(source.id)}
              onToggleComplete={() => void toggleCompleted(source.id)}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() =>
                setVisibleCount((n) =>
                  Math.min(n + PAGE_SIZE, filteredSources.length)
                )
              }
              className="btn-secondary px-6 py-3 text-sm"
            >
              Show more sources ({filteredSources.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </section>

      <SourceInstructionsOverlay
        source={selectedSource}
        isDone={selectedSource ? completed.has(selectedSource.id) : false}
        copied={
          selectedSource != null && copiedDescId === selectedSource.id
        }
        onClose={() => setExpandedId(null)}
        onToggleComplete={() => {
          if (selectedSource) void toggleCompleted(selectedSource.id);
        }}
        onCopyDescription={() => {
          if (!selectedSource) return;
          void copyToClipboard(
            renderSourceCopy(selectedSource.description, pageUrl)
          );
          setCopiedDescId(selectedSource.id);
          window.setTimeout(() => setCopiedDescId(null), 2000);
        }}
        renderCopy={(template) => renderSourceCopy(template, pageUrl)}
      />
    </PremiumPageLayout>
  );
}
