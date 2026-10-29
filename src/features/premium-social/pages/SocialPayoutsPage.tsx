"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Megaphone,
  Copy,
  Check,
  ChevronDown,
  ClipboardCopy,
  Clock3,
  Gift,
  Loader2,
  MessagesSquare,
  ScrollText,
  Shuffle,
  Sparkles,
  FolderOpen,
  Timer,
} from "lucide-react";
import { clsx } from "clsx";
import { brand } from "@/config/brand.config";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { GenerationProgress, GENERATION_RESULTS_ID } from "@/components/ui/generation-progress";
import { PremiumPageLayout } from "@/components/premium/PremiumPageLayout";
import { PremiumControlCard } from "@/components/premium/PremiumControlCard";
import { PremiumFooter } from "@/components/premium/PremiumFooter";
import { PremiumErrorAlert } from "@/components/premium/PremiumErrorAlert";
import { PremiumVideoTutorial } from "@/components/premium/PremiumVideoTutorial";
import { PremiumStepsSection } from "@/components/premium/PremiumStepsSection";
import { PremiumBestPracticesSection } from "@/components/premium/PremiumBestPracticesSection";
import { getFeatureThumbnail } from "@/lib/video-thumbnails";
import { formatThreadVersionDate } from "@/features/publish-kit/lib/thread-batches";
import { getSiteTerritory } from "@/features/blog-builder/lib/site-territory";
import { getAppUrl } from "@/lib/brand-vars";
import { copyToClipboard } from "@/lib/clipboard";
import { sitePublicPath } from "@/lib/app-url";
import type { SiteVaultSummary } from "@/app/api/blog/site/route";

interface SavedPost {
  id: string;
  body: string;
  batchId?: string;
  createdAt?: string;
}

interface PostGeneration {
  batchId: string;
  createdAt: string;
  posts: SavedPost[];
}

interface PostCardProps {
  post: SavedPost;
  index: number;
  copiedId: string | null;
  onCopy: (post: SavedPost) => void;
}

const PostCard = memo(function PostCard({ post, index, copiedId, onCopy }: PostCardProps) {
  const isCopied = copiedId === post.id;

  return (
    <article className="glass-card flex flex-col gap-3 p-4 transition-colors hover:border-[var(--mcv-line-brass)] [content-visibility:auto] [contain-intrinsic-size:auto_180px]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium uppercase tracking-wider text-brass-700">
          Variant {index + 1}
        </p>
        <button
          type="button"
          onClick={() => onCopy(post)}
          className={clsx(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
            isCopied
              ? "bg-brass-200 text-brass-700"
              : "bg-brass-100 text-text-secondary hover:bg-brass-100/70"
          )}
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{post.body}</p>
    </article>
  );
});

function GenerationCard({
  generation,
  name,
  open,
  onToggle,
  copiedId,
  onCopy,
}: {
  generation: PostGeneration;
  name: string;
  open: boolean;
  onToggle: () => void;
  copiedId: string | null;
  onCopy: (post: SavedPost) => void;
}) {
  const [copiedAll, setCopiedAll] = useState(false);

  const copyAll = async () => {
    try {
      const text = generation.posts
        .map((post, i) => `Variant ${i + 1}\n${post.body}`)
        .join("\n\n---\n\n");
      await copyToClipboard(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="glass-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 pr-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left transition-colors hover:bg-canvas"
        >
          <ChevronDown
            size={16}
            className={clsx("shrink-0 text-text-muted transition-transform", open && "rotate-180")}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{name}</p>
            <p className="text-xs text-text-muted">
              Generated {formatThreadVersionDate(generation.createdAt)} · {generation.posts.length}{" "}
              post{generation.posts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => void copyAll()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border-dim bg-white px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:border-[var(--mcv-line-brass)] hover:text-brass-700"
        >
          {copiedAll ? <Check size={13} /> : <ClipboardCopy size={13} />}
          {copiedAll ? "Copied!" : "Copy all"}
        </button>
      </div>

      {open && (
        <div className="grid gap-3 border-t border-border-dim/70 p-4 sm:grid-cols-2">
          {generation.posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} copiedId={copiedId} onCopy={onCopy} />
          ))}
        </div>
      )}
    </section>
  );
}

function offerLabel(summary: SiteVaultSummary): string {
  const title = summary.site.title || getSiteTerritory(summary.site);
  if (summary.facebookPostCount > 0) {
    return `${title} (${summary.facebookPostCount} saved posts)`;
  }
  return title;
}

const FACEBOOK_BEST_PRACTICES = [
  {
    icon: ScrollText,
    title: "Read each group's rules first",
    desc: "Some groups ban outside links, some only allow them on promo days like \"Self-Promo Saturday\", and some require admin approval. One rule-breaking post can get you muted or banned — check the pinned rules before every post.",
  },
  {
    icon: Gift,
    title: "Lead with value (70/30 rule)",
    desc: "Spend your first 1–2 weeks in a group answering questions and sharing tips before dropping any link. Keep roughly 70% of your activity pure value and only 30% promotional — that's what keeps you welcome.",
  },
  {
    icon: MessagesSquare,
    title: "Put your link in the first comment",
    desc: "Posts with links in the body get their reach limited. Where the group allows it, keep the post itself helpful and drop your offer link in the first comment instead.",
  },
  {
    icon: Shuffle,
    title: "Use a different variant per group",
    desc: "Identical text across groups is the clearest spam fingerprint on Facebook. That's exactly why you get 10 variants here — pick a different one for every group you post in.",
  },
  {
    icon: Timer,
    title: "Pace yourself",
    desc: "Space posts at least 1–2 minutes apart and stay under roughly 25–50 groups a day. Blasting the same offer into 30 groups in one minute reads as a bot and tanks your account.",
  },
  {
    icon: Clock3,
    title: "Post at peak times & disclose",
    desc: "Tuesday–Thursday mornings (8–10 AM) and lunch breaks (12–1 PM) tend to perform best — test your niche. And always add a short disclosure like \"I may earn a commission\" at the top of the post.",
  },
];

export default function SocialPayoutsPage() {
  const searchParams = useSearchParams();
  const initialSiteId = searchParams.get("siteId");

  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<SiteVaultSummary[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [postsBySite, setPostsBySite] = useState<Record<string, SavedPost[]>>({});
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const posts = useMemo(
    () => postsBySite[selectedSiteId] ?? [],
    [postsBySite, selectedSiteId]
  );

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/blog/site?lite=1", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load offers");
        const list = Array.isArray(data.summaries) ? (data.summaries as SiteVaultSummary[]) : [];
        setOffers(list);

        // Only preselect when explicitly deep-linked (e.g. from Offers Library).
        if (initialSiteId && list.some((o) => o.site.id === initialSiteId)) {
          setSelectedSiteId(initialSiteId);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load offers");
      } finally {
        setLoading(false);
      }
    })();
  }, [initialSiteId]);

  const loadPosts = useCallback(async (siteId: string) => {
    if (!siteId) return;

    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/premium/social-payouts?siteId=${encodeURIComponent(siteId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        const loaded = (data.posts ?? []) as SavedPost[];
        setPostsBySite((prev) => ({ ...prev, [siteId]: loaded }));
        setOffers((prev) =>
          prev.map((o) =>
            o.site.id === siteId ? { ...o, facebookPostCount: loaded.length } : o
          )
        );
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSiteId || offers.length === 0) return;
    if (Object.prototype.hasOwnProperty.call(postsBySite, selectedSiteId)) return;
    void loadPosts(selectedSiteId);
  }, [selectedSiteId, offers.length, loadPosts, postsBySite]);

  const selectedOffer = useMemo(
    () => offers.find((o) => o.site.id === selectedSiteId),
    [offers, selectedSiteId]
  );

  const offerPageUrl = useMemo(() => {
    if (!selectedOffer) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : getAppUrl();
    return `${origin}${sitePublicPath(selectedOffer.site)}`;
  }, [selectedOffer]);

  // Group saved posts into generations (batches), newest first.
  const generations = useMemo<PostGeneration[]>(() => {
    const map = new Map<string, PostGeneration>();
    for (const post of posts) {
      const batchId = post.batchId ?? "legacy";
      let generation = map.get(batchId);
      if (!generation) {
        generation = { batchId, createdAt: post.createdAt ?? "", posts: [] };
        map.set(batchId, generation);
      }
      generation.posts.push(post);
    }
    return [...map.values()];
  }, [posts]);

  const hasExistingPosts = (selectedOffer?.facebookPostCount ?? 0) > 0 || posts.length > 0;

  const handleGenerate = async () => {
    if (!selectedSiteId) {
      setError("Select an offer first.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/premium/social-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: selectedSiteId, siteUrl: offerPageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      await loadPosts(selectedSiteId);
      // Expand the freshly generated set so results are immediately visible.
      if (typeof data.batchId === "string" && data.batchId) {
        setOpenBatchId(data.batchId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = useCallback(async (post: SavedPost) => {
    try {
      await copyToClipboard(post.body);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  if (loading) {
    return (
      <PremiumPageLayout
        title="Social Payouts"
        subtitle="Bulk social posts — pick an offer, generate 10+ Facebook variants with different hooks and angles, then copy and paste."
        animate={false}
      >
        <PageSkeleton cards={2} />
      </PremiumPageLayout>
    );
  }

  return (
    <PremiumPageLayout
      title="Social Payouts"
      subtitle="Bulk social posts — pick an offer, or generate 10 Facebook variants from a single link."
      actions={
        <Link href="/social-payouts/ten" className="btn-secondary">
          10 posts from a link
        </Link>
      }
      footer={
        <PremiumFooter>
          Powered by {brand.productName}. Social Payouts uses the bulk post engine.
        </PremiumFooter>
      }
    >
      <PremiumVideoTutorial
        vimeoId="1215574185"
        title="Social Payouts Training"
        description="Watch how to turn one offer into 10+ scroll-stopping Facebook posts with different hooks and angles — then copy, paste, and post."
        iframeTitle="Social Payouts training video"
        thumbnailSrc={getFeatureThumbnail("social-payouts")}
      />

      <PremiumStepsSection
        steps={[
          {
            num: "1",
            title: "Select an offer",
            desc: "Pick any sales page from your Offers Library — its link gets baked into every post automatically.",
          },
          {
            num: "2",
            title: "Generate post variants",
            desc: "One click creates 10+ Facebook posts with different hooks and angles so you never sound repetitive.",
          },
          {
            num: "3",
            title: "Copy and post",
            desc: "Copy your favorites and paste them into groups and pages. Every generation is saved as its own set.",
          },
        ]}
      />

      <PremiumBestPracticesSection
        title="Facebook Posting Best Practices"
        subtitle="Follow these and your posts keep reaching people instead of getting flagged."
        items={FACEBOOK_BEST_PRACTICES}
      />

      {offers.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No offers yet"
          description="Create an offer first, then generate social posts for it."
          action={{ label: "Create an offer", href: "/sales-offer-generator" }}
        />
      ) : (
        <PremiumControlCard
          icon={Megaphone}
          title="Bulk post generator"
          description="One offer → many scroll-stopping posts with your link baked in."
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-text-primary">Select offer</span>
            <select
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                setOpenBatchId(null);
                setError("");
              }}
              className="input-base w-full"
            >
              <option value="" disabled>
                Choose an offer to promote…
              </option>
              {offers.map((o) => (
                <option key={o.site.id} value={o.site.id}>
                  {offerLabel(o)}
                </option>
              ))}
            </select>
          </label>

          {selectedOffer ? (
            <p className="text-xs text-text-muted">
              Niche: {getSiteTerritory(selectedOffer.site)}
              {selectedOffer.site.armed_links?.[0]?.url
                ? " · Link armed"
                : " · Add a link in Links Library for best results"}
              {selectedOffer.facebookPostCount > 0
                ? ` · ${selectedOffer.facebookPostCount} saved posts`
                : ""}
            </p>
          ) : (
            <p className="text-xs text-text-muted">
              Pick one of your offers to see its saved post sets and generate new ones.
            </p>
          )}

          {error && <PremiumErrorAlert message={error} />}

          <div className="space-y-2">
            <button
              type="button"
              disabled={generating || !selectedSiteId}
              onClick={() => void handleGenerate()}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating
                ? "Generating 10 posts…"
                : hasExistingPosts
                  ? "Generate new posts"
                  : "Generate posts"}
            </button>
            {hasExistingPosts && !generating && (
              <p className="text-xs text-text-muted">
                Each generation is saved as a new post set — your older sets stay below.
              </p>
            )}
          </div>
        </PremiumControlCard>
      )}

      <GenerationProgress
        active={generating}
        label="Generating 10 scroll-stopping Facebook post variants..."
      />

      {selectedSiteId && (loadingPosts || generations.length > 0) && (
        <section id={GENERATION_RESULTS_ID} className="scroll-mt-24 space-y-3">
          <h2 className="text-lg font-medium text-text-primary">
            {loadingPosts && generations.length === 0
              ? "Loading saved posts…"
              : `Saved post sets (${generations.length})`}
          </h2>

          {loadingPosts && generations.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-divider bg-canvas px-4 py-6 text-sm text-text-muted">
              <Loader2 size={16} className="animate-spin" />
              Loading saved posts…
            </div>
          ) : (
            generations.map((generation, i) => (
              <GenerationCard
                key={generation.batchId}
                generation={generation}
                name={`Post set #${generations.length - i}`}
                open={openBatchId === generation.batchId}
                onToggle={() =>
                  setOpenBatchId((prev) =>
                    prev === generation.batchId ? null : generation.batchId
                  )
                }
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            ))
          )}
        </section>
      )}
    </PremiumPageLayout>
  );
}
