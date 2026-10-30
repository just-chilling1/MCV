"use client";

import { useCallback, useState } from "react";
import {
  Check,
  Copy,
  FileText,
  Loader2,
  Megaphone,
  PenLine,
  RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { GENERATION_RESULTS_ID } from "@/components/ui/generation-progress";
import { ThreadListSection } from "@/features/publish-kit/components/ThreadListSection";
import { sanitizePostHtml } from "@/features/blog-builder/lib/sanitize-html";
import { copyToClipboard } from "@/lib/clipboard";

export interface DfyKitMeta {
  siteId: string;
  productName: string;
  niche: string;
}

export interface DfyCraftResult {
  id: string | null;
  title: string;
  content: string;
  hook?: string | null;
  cta?: string | null;
}

export interface DfyArticleResult {
  id: string | null;
  title: string;
  excerpt: string;
  html: string;
}

export interface DfyFacebookPost {
  id: string;
  body: string;
}

interface DfyResultPanelProps {
  kit: DfyKitMeta | null;
  craft: DfyCraftResult | null;
  article: DfyArticleResult | null;
  posts: DfyFacebookPost[];
  craftError: string;
  articleError: string;
  postsError: string;
  imagesError: string;
  isGeneratingCraft: boolean;
  isGeneratingArticle: boolean;
  isGeneratingPosts: boolean;
  isGeneratingImages: boolean;
  retryingCraft: boolean;
  retryingArticle: boolean;
  retryingPosts: boolean;
  retryingImages: boolean;
  onRetryCraft: () => void;
  onRetryArticle: () => void;
  onRetryPosts: () => void;
  onRetryImages: () => void;
}

function htmlToPlainText(html: string) {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ArticlePreview({
  title,
  html,
  copyPrefix,
  copiedId,
  onCopy,
}: {
  title: string;
  html: string;
  copyPrefix: string;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <details open className="group overflow-hidden rounded-xl border border-border-dim bg-field">
      <summary className="flex cursor-pointer list-none items-center gap-3 border-b border-border-dim p-3 [&::-webkit-details-marker]:hidden">
        <FileText size={14} className="shrink-0 text-success" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-heading">{title}</span>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            void onCopy(`${copyPrefix}-html`, html);
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--mcv-line-brass)] bg-brass-100 px-2.5 py-1 text-[13px] font-medium text-success hover:bg-brass-200"
        >
          {copiedId === `${copyPrefix}-html` ? <Check size={12} /> : <Copy size={12} />}
          {copiedId === `${copyPrefix}-html` ? "Copied" : "Copy HTML"}
        </button>
      </summary>
      <div
        className="dfy-article-body recurring-article-body max-h-[560px] overflow-y-auto px-5 py-6"
        dangerouslySetInnerHTML={{ __html: sanitizePostHtml(html) }}
      />
      <div className="flex flex-wrap gap-2 border-t border-border-dim p-3">
        <button
          type="button"
          onClick={() => void onCopy(`${copyPrefix}-text`, htmlToPlainText(html))}
          className="btn-secondary inline-flex items-center gap-2 text-sm"
        >
          {copiedId === `${copyPrefix}-text` ? <Check size={14} /> : <Copy size={14} />}
          {copiedId === `${copyPrefix}-text` ? "Copied" : "Copy text"}
        </button>
      </div>
    </details>
  );
}

export function DfyResultPanel({
  kit,
  craft,
  article,
  posts,
  craftError,
  articleError,
  postsError,
  imagesError,
  isGeneratingCraft,
  isGeneratingArticle,
  isGeneratingPosts,
  isGeneratingImages,
  retryingCraft,
  retryingArticle,
  retryingPosts,
  retryingImages,
  onRetryCraft,
  onRetryArticle,
  onRetryPosts,
  onRetryImages,
}: DfyResultPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = useCallback(async (id: string, text: string) => {
    try {
      await copyToClipboard(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  if (
    !kit &&
    !craft &&
    !article &&
    posts.length === 0 &&
    !craftError &&
    !articleError &&
    !postsError &&
    !imagesError
  ) {
    return null;
  }

  const showImageStatus =
    isGeneratingImages ||
    retryingImages ||
    Boolean(imagesError) ||
    Boolean(craft?.content.includes("data-article-image")) ||
    Boolean(article?.html.includes("data-article-image"));

  return (
    <section id={GENERATION_RESULTS_ID} className="scroll-mt-24 space-y-4">
      <h2 className="text-lg font-medium text-text-primary">Your Done-For-You kit</h2>

      {kit ? (
        <p className="text-sm text-text-muted">
          {kit.productName}
          {kit.niche ? ` · ${kit.niche}` : ""}
        </p>
      ) : null}

      {showImageStatus ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-dim bg-field px-4 py-3 text-sm text-text-secondary">
          {isGeneratingImages || retryingImages ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Embedding header, mid, and conclusion images into your articles…
            </span>
          ) : imagesError ? (
            <>
              <span className="text-warning">{imagesError}</span>
              <button
                type="button"
                disabled={retryingImages || (!craft && !article)}
                onClick={onRetryImages}
                className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <RefreshCw size={14} />
                Retry images
              </button>
            </>
          ) : (
            <span>Header, mid, and conclusion images are embedded in the articles below.</span>
          )}
        </div>
      ) : null}

      <ThreadListSection
        title="Craft article"
        count={craft ? 1 : undefined}
        defaultOpen={Boolean(craft)}
      >
        <div className="flex items-start gap-3">
          <PenLine size={18} className="mt-0.5 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary">
              {craft?.title || "Craft article"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {craft
                ? "Saved to My Vault — edit or broadcast anytime."
                : retryingCraft || isGeneratingCraft
                  ? "Writing your Craft article…"
                  : craftError || "Your Craft article will appear here."}
            </p>
          </div>
        </div>
        {isGeneratingCraft || retryingCraft ? (
          <p className="inline-flex items-center gap-2 text-sm text-text-muted">
            <Loader2 size={14} className="animate-spin" />
            Generating Craft article…
          </p>
        ) : craftError ? (
          <button
            type="button"
            disabled={retryingCraft}
            onClick={onRetryCraft}
            className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Retry Craft article
          </button>
        ) : craft ? (
          <div className="space-y-3">
            <ArticlePreview
              title={craft.title}
              html={craft.content}
              copyPrefix="craft"
              copiedId={copiedId}
              onCopy={copyText}
            />
            {craft.id ? (
              <Link href={`/vault/${craft.id}`} className="auth-link text-sm font-medium">
                Open in My Vault →
              </Link>
            ) : null}
          </div>
        ) : null}
      </ThreadListSection>

      <ThreadListSection
        title="Authority article"
        count={article ? 1 : undefined}
        defaultOpen={Boolean(article)}
      >
        <div className="flex items-start gap-3">
          <FileText size={18} className="mt-0.5 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary">
              {article?.title || "Authority article"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {article
                ? "Long-form copy for blogs, Medium, or LinkedIn."
                : retryingArticle || isGeneratingArticle
                  ? "Writing your authority article…"
                  : articleError || "Your authority article will appear here."}
            </p>
          </div>
        </div>
        {isGeneratingArticle || retryingArticle ? (
          <p className="inline-flex items-center gap-2 text-sm text-text-muted">
            <Loader2 size={14} className="animate-spin" />
            Generating your authority article…
          </p>
        ) : articleError ? (
          <button
            type="button"
            disabled={retryingArticle}
            onClick={onRetryArticle}
            className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Retry authority article
          </button>
        ) : article ? (
          <ArticlePreview
            title={article.title}
            html={article.html}
            copyPrefix="authority"
            copiedId={copiedId}
            onCopy={copyText}
          />
        ) : null}
      </ThreadListSection>

      <ThreadListSection
        title="Facebook posts"
        count={posts.length || undefined}
        defaultOpen={posts.length > 0}
      >
        <div className="flex items-start gap-3">
          <Megaphone size={18} className="mt-0.5 shrink-0 text-success" />
          <p className="text-sm text-text-secondary">
            {posts.length > 0
              ? `${posts.length} ready-to-copy variants`
              : postsError || "Your Facebook post variants will appear here."}
          </p>
        </div>
        {isGeneratingPosts && posts.length === 0 ? (
          <p className="inline-flex items-center gap-2 text-sm text-text-muted">
            <Loader2 size={14} className="animate-spin" />
            Generating Facebook posts…
          </p>
        ) : postsError && posts.length === 0 ? (
          <button
            type="button"
            disabled={retryingPosts}
            onClick={onRetryPosts}
            className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {retryingPosts ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Retry Facebook posts
          </button>
        ) : posts.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {posts.map((post, index) => {
              const copied = copiedId === post.id;
              return (
                <article
                  key={post.id}
                  className="glass-card flex flex-col gap-3 p-4 transition-colors hover:border-[var(--mcv-line-brass)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium uppercase tracking-wider text-brass-700">
                      Variant {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyText(post.id, post.body)}
                      className={clsx(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                        copied
                          ? "bg-brass-200 text-brass-700"
                          : "bg-brass-100 text-text-secondary hover:bg-brass-100/70"
                      )}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                    {post.body}
                  </p>
                </article>
              );
            })}
          </div>
        ) : null}
      </ThreadListSection>
    </section>
  );
}
