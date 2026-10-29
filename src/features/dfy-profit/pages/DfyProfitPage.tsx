"use client";

import { useCallback, useState } from "react";
import { Check, Loader2, Sparkles, Wallet } from "lucide-react";
import { clsx } from "clsx";
import { brand } from "@/config/brand.config";
import { AffiliateLinkField } from "@/components/premium/AffiliateLinkField";
import { PremiumControlCard } from "@/components/premium/PremiumControlCard";
import { PremiumErrorAlert } from "@/components/premium/PremiumErrorAlert";
import { PremiumFooter } from "@/components/premium/PremiumFooter";
import { PremiumPageLayout } from "@/components/premium/PremiumPageLayout";
import { PremiumVideoTutorial } from "@/components/premium/PremiumVideoTutorial";
import { getFeatureThumbnail } from "@/lib/video-thumbnails";
import { PremiumStepsSection } from "@/components/premium/PremiumStepsSection";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { isValidAffiliateUrl } from "@/features/blog-builder/lib/affiliate-url";
import { NICHE_OPTIONS } from "@/features/blog-builder/types";
import {
  DfyResultPanel,
  type DfyArticleResult,
  type DfyCraftResult,
  type DfyFacebookPost,
  type DfyKitMeta,
} from "@/features/dfy-profit/components/DfyResultPanel";

type Stage = "idle" | "setup" | "craft" | "article" | "posts" | "done";

const STAGE_LABELS: Record<Exclude<Stage, "idle" | "done">, string> = {
  setup: "Setting up your kit…",
  craft: "Writing your Craft article…",
  article: "Writing your authority article…",
  posts: "Generating Facebook posts…",
};

export default function DfyProfitPage() {
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [kit, setKit] = useState<DfyKitMeta | null>(null);
  const [craft, setCraft] = useState<DfyCraftResult | null>(null);
  const [article, setArticle] = useState<DfyArticleResult | null>(null);
  const [posts, setPosts] = useState<DfyFacebookPost[]>([]);
  const [productContext, setProductContext] = useState("");
  const [productName, setProductName] = useState("");
  const [nicheLabel, setNicheLabel] = useState("");
  const [craftError, setCraftError] = useState("");
  const [articleError, setArticleError] = useState("");
  const [postsError, setPostsError] = useState("");
  const [retryingCraft, setRetryingCraft] = useState(false);
  const [retryingArticle, setRetryingArticle] = useState(false);
  const [retryingPosts, setRetryingPosts] = useState(false);

  const generating =
    stage === "setup" || stage === "craft" || stage === "article" || stage === "posts";

  const runCraftStage = useCallback(
    async (siteId: string, ctx: string, name: string, nicheName: string, link: string) => {
      const res = await fetch("/api/premium/dfy-profit/craft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          productContext: ctx,
          productName: name,
          niche: nicheName,
          affiliateUrl: link,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Craft article generation failed");
      return {
        id: (data.id as string | null) ?? null,
        title: data.title as string,
        content: data.content as string,
        hook: data.hook as string | null | undefined,
        cta: data.cta as string | null | undefined,
      } satisfies DfyCraftResult;
    },
    []
  );

  const runArticleStage = useCallback(
    async (siteId: string, ctx: string, name: string, nicheName: string) => {
      const res = await fetch("/api/premium/dfy-profit/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          productContext: ctx,
          productName: name,
          niche: nicheName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Article generation failed");
      return {
        title: data.title as string,
        excerpt: data.excerpt as string,
        html: data.html as string,
      } satisfies DfyArticleResult;
    },
    []
  );

  const runPostsStage = useCallback(async (siteId: string) => {
    const res = await fetch("/api/premium/dfy-profit/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Facebook post generation failed");
    return (data.posts ?? []) as DfyFacebookPost[];
  }, []);

  const handleGenerate = async () => {
    if (!isValidAffiliateUrl(affiliateUrl)) {
      setError("Enter a valid affiliate URL starting with https://");
      return;
    }
    if (!niche) {
      setError("Pick a niche first.");
      return;
    }

    setError("");
    setCraftError("");
    setArticleError("");
    setPostsError("");
    setKit(null);
    setCraft(null);
    setArticle(null);
    setPosts([]);
    setStage("setup");

    let siteId = "";
    let ctx = "";
    let name = "";
    let nicheName = "";
    let link = affiliateUrl;

    try {
      const startRes = await fetch("/api/premium/dfy-profit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateUrl, niche }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || "Kit setup failed");

      siteId = startData.siteId as string;
      ctx = (startData.productContext as string) || "";
      name = (startData.productName as string) || "";
      nicheName = (startData.niche as string) || niche;
      link = (startData.affiliateUrl as string) || affiliateUrl;
      setProductContext(ctx);
      setProductName(name);
      setNicheLabel(nicheName);
      setKit({ siteId, productName: name, niche: nicheName });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kit setup failed");
      setStage("idle");
      return;
    }

    setStage("craft");
    try {
      const craftResult = await runCraftStage(siteId, ctx, name, nicheName, link);
      setCraft(craftResult);
    } catch (e) {
      setCraftError(e instanceof Error ? e.message : "Craft article generation failed");
    }

    setStage("article");
    try {
      const articleResult = await runArticleStage(siteId, ctx, name, nicheName);
      setArticle(articleResult);
    } catch (e) {
      setArticleError(e instanceof Error ? e.message : "Article generation failed");
    }

    setStage("posts");
    try {
      const postsResult = await runPostsStage(siteId);
      setPosts(postsResult);
    } catch (e) {
      setPostsError(e instanceof Error ? e.message : "Facebook post generation failed");
    }

    setStage("done");
  };

  const handleRetryCraft = async () => {
    if (!kit?.siteId) return;
    setRetryingCraft(true);
    setCraftError("");
    try {
      const result = await runCraftStage(
        kit.siteId,
        productContext,
        productName,
        nicheLabel,
        affiliateUrl
      );
      setCraft(result);
    } catch (e) {
      setCraftError(e instanceof Error ? e.message : "Craft article generation failed");
    } finally {
      setRetryingCraft(false);
    }
  };

  const handleRetryArticle = async () => {
    if (!kit?.siteId) return;
    setRetryingArticle(true);
    try {
      const result = await runArticleStage(
        kit.siteId,
        productContext,
        productName,
        nicheLabel
      );
      setArticle(result);
      setArticleError("");
    } catch (e) {
      setArticleError(e instanceof Error ? e.message : "Article generation failed");
    } finally {
      setRetryingArticle(false);
    }
  };

  const handleRetryPosts = async () => {
    if (!kit?.siteId) return;
    setRetryingPosts(true);
    setPostsError("");
    try {
      const result = await runPostsStage(kit.siteId);
      setPosts(result);
    } catch (e) {
      setPostsError(e instanceof Error ? e.message : "Facebook post generation failed");
    } finally {
      setRetryingPosts(false);
    }
  };

  return (
    <PremiumPageLayout
      title="Done-For-You Profit"
      subtitle="Paste your affiliate link, pick a niche, and get a Craft article, an authority article, and 3 Facebook posts in one run."
      footer={
        <PremiumFooter>
          Powered by {brand.productName}. The Craft article is saved to My Vault.
        </PremiumFooter>
      }
    >
      <PremiumVideoTutorial
        title="How to Use Done-For-You Profit"
        description="Paste a link, pick a niche, generate your kit — Craft article, authority article, and three Facebook posts."
        iframeTitle="Done-For-You Profit Tutorial"
        thumbnailSrc={getFeatureThumbnail("dfy-profit")}
      />

      <PremiumStepsSection
        steps={[
          {
            num: "1",
            title: "Add your link",
            desc: "Paste an affiliate URL or pick one from your Links Library.",
          },
          {
            num: "2",
            title: "Pick a niche",
            desc: "Choose the niche so both articles and posts stay on-brand.",
          },
          {
            num: "3",
            title: "Generate your kit",
            desc: "We create 1 Craft article, 1 authority article, and 3 Facebook posts.",
          },
        ]}
      />

      <PremiumControlCard
        icon={Wallet}
        title="Generate your kit"
        description="One click creates a Craft article (saved to Vault), a long-form authority article, and 3 Facebook posts."
      >
        <div className="space-y-2">
          <span className="block text-sm font-medium text-text-primary">Affiliate link</span>
          <AffiliateLinkField
            value={affiliateUrl}
            onChange={setAffiliateUrl}
            inputId="dfy-profit-affiliate-link"
          />
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-medium text-text-primary">2. Niche</legend>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--mcv-line-brass)] bg-canvas/60 p-3">
            {NICHE_OPTIONS.map((option) => {
              const selected = niche === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={generating}
                  onClick={() => setNiche(option.value)}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-[999px] border px-4 py-2.5 text-[13px] font-medium transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0",
                    selected
                      ? "border-[var(--mcv-line-brass)] bg-brass-500 text-white shadow-[var(--mcv-shadow-brass)]"
                      : "border-border-dim bg-surface text-text-secondary hover:-translate-y-0.5 hover:border-[var(--mcv-line-brass)] hover:bg-brass-100/60 hover:text-text-primary hover:shadow-sm"
                  )}
                >
                  {selected && <Check size={13} />}
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && <PremiumErrorAlert message={error} />}

        <button
          type="button"
          disabled={generating}
          onClick={() => void handleGenerate()}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generating ? "Generating…" : kit ? "Generate another kit" : "Generate kit"}
        </button>
      </PremiumControlCard>

      <GenerationProgress
        active={generating}
        label={
          stage === "setup" || stage === "craft" || stage === "article" || stage === "posts"
            ? STAGE_LABELS[stage]
            : "Generating…"
        }
      />

      <DfyResultPanel
        kit={kit}
        craft={craft}
        article={article}
        posts={posts}
        craftError={craftError}
        articleError={articleError}
        postsError={postsError}
        isGeneratingCraft={stage === "craft"}
        isGeneratingArticle={stage === "article"}
        isGeneratingPosts={stage === "posts"}
        retryingCraft={retryingCraft}
        retryingArticle={retryingArticle}
        retryingPosts={retryingPosts}
        onRetryCraft={() => void handleRetryCraft()}
        onRetryArticle={() => void handleRetryArticle()}
        onRetryPosts={() => void handleRetryPosts()}
      />
    </PremiumPageLayout>
  );
}
