"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare, Sparkles, RefreshCw, ExternalLink,
    Copy, Check, ChevronUp, ChevronDown, Link as LinkIcon,
    Radar, Trash2, ArrowLeft, Loader2
} from "lucide-react";
import { useSearch, Ad } from "@/features/core-workflow/context/SearchContext";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { SuccessCelebration } from "@/features/core-workflow/components/SuccessCelebration";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { copyToClipboard } from "@/lib/clipboard";

function PlatformBadge({ platform }: { platform: string }) {
    const isReddit = platform === "Reddit";
    return (
        <span className={clsx(
            "text-[13px] font-medium uppercase tracking-widest px-2 py-0.5 rounded border inline-flex items-center gap-1",
            isReddit
                ? "text-[var(--mcv-warning)] border-[var(--mcv-warning)]/20 bg-[var(--mcv-warning)]/10"
                : "text-[var(--mcv-danger)] border-[var(--mcv-danger)]/20 bg-[var(--mcv-danger)]/10"
        )}>
            {platform}
        </span>
    );
}

export default function RepliesPage() {
    const {
        selectedAds, setSelectedAds, keyword,
        repliesByPostId, setRepliesByPostId,
        affiliateLink, setAffiliateLink
    } = useSearch();
    const router = useRouter();
    const currentAds = selectedAds || [];
    const [loadingReplyId, setLoadingReplyId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [showCelebration, setShowCelebration] = useState(false);
    const [totalGenerated, setTotalGenerated] = useState(0);

    const handleGenerate = async (post: Ad) => {
        setLoadingReplyId(post.id);
        setExpandedIds(prev => new Set(prev).add(post.id));

        try {
            const resp = await fetch("/api/replies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ads: [post], affiliateLink: affiliateLink || "" })
            });
            const data = await resp.json();
            const result = data.results?.[0];
            if (result?.replies) {
                setRepliesByPostId({ ...repliesByPostId, [post.id]: result.replies });
                const newTotal = totalGenerated + 1;
                setTotalGenerated(newTotal);
                if (newTotal === 1) setShowCelebration(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingReplyId(null);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const [copyCount, setCopyCount] = useState(0);
    const [showCopyWin, setShowCopyWin] = useState(false);

    const handleCopy = (text: string, id: string) => {
        copyToClipboard(text);
        setCopiedId(id);
        const newCount = copyCount + 1;
        setCopyCount(newCount);
        if (newCount === 3) setShowCopyWin(true);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const removePost = (id: string) => {
        setSelectedAds(selectedAds.filter((p: Ad) => p.id !== id));
    };

    const renderFormattedReply = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <span key={i} className="text-info hover:underline cursor-pointer transition-colors break-all">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    if (currentAds.length === 0) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-14 h-14 rounded-xl bg-surface flex items-center justify-center border border-border-dim">
                    <Radar size={24} className="text-text-muted" />
                </div>
                <div className="text-center flex flex-col gap-2">
                    <h2 className="text-xl font-medium text-text-primary">No Ads Selected</h2>
                    <p className="text-sm text-text-muted">Go to Step 3 and pick ads first.</p>
                </div>
                <button onClick={() => router.push("/radar")} className="btn-primary">
                    <Radar size={16} />
                    <span>Go to Step 3: Find Ads</span>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="page-container py-6"
        >
            <SuccessCelebration
                show={showCelebration}
                title="Replies Ready to Copy!"
                subtitle="Just paste these under the ad and watch the clicks roll in."
                onDone={() => setShowCelebration(false)}
            />
            <SuccessCelebration
                show={showCopyWin}
                title="You're On Fire!"
                subtitle="3 replies copied. You're doing exactly what top earners do. Keep going!"
                onDone={() => setShowCopyWin(false)}
            />

            {/* Header */}
            <header className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brass-100 border border-[var(--mcv-line-brass)] flex items-center justify-center rounded-lg">
                            <MessageSquare size={20} className="text-brass-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl text-text-primary font-medium tracking-tight">Step 4: Create Replies</h1>
                            <p className="text-sm text-text-muted">
                                {currentAds.length} ad{currentAds.length !== 1 ? "s" : ""} selected for &ldquo;{keyword}&rdquo;
                            </p>
                        </div>
                    </div>
                </div>

                {/* Affiliate link */}
                <div className="flex items-center gap-3 p-3 surface-inset border-border-dim/30">
                    <LinkIcon size={14} className="text-text-muted shrink-0" />
                    <input
                        type="text"
                        placeholder="Paste your affiliate link here (optional — it gets inserted into replies)"
                        className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted/50 flex-1"
                        value={affiliateLink}
                        onChange={(e) => setAffiliateLink(e.target.value)}
                    />
                </div>
            </header>

            <GenerationProgress
                active={loadingReplyId !== null}
                label="Creating personalized replies with your affiliate link..."
                scrollTargetId={loadingReplyId ? `generation-results-${loadingReplyId}` : undefined}
            />

            {/* Ad cards */}
            <div className="flex flex-col gap-4">
                {currentAds.map((post, idx) => {
                    const replies = repliesByPostId[post.id] || [];
                    const isExpanded = expandedIds.has(post.id);
                    const isLoading = loadingReplyId === post.id;

                    return (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="surface-inset border-border-dim/30 overflow-hidden"
                        >
                            {/* Ad header */}
                            <div className="p-4 flex items-start justify-between gap-3">
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <PlatformBadge platform={post.platform} />
                                        <span className="text-[13px] text-text-muted">
                                            {typeof post.engagement === 'number'
                                                ? `${post.engagement.toLocaleString()} engagements`
                                                : post.engagement || "Trending"}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-text-primary leading-relaxed font-medium line-clamp-2">
                                        {post.title || post.text}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => removePost(post.id)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-[var(--mcv-danger)] hover:bg-[var(--mcv-danger)]/10 transition-all"
                                        title="Remove ad"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                    <a
                                        href={post.url} target="_blank" rel="noopener noreferrer"
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-brass-700 hover:bg-brass-100 transition-all"
                                    >
                                        <ExternalLink size={13} />
                                    </a>
                                </div>
                            </div>

                            {/* Action bar */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-dim/15 bg-page">
                                <button
                                    onClick={() => {
                                        if (replies.length === 0) handleGenerate(post);
                                        else toggleExpand(post.id);
                                    }}
                                    disabled={isLoading}
                                    className={clsx(
                                        "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                                        isLoading ? "text-text-muted" :
                                        isExpanded ? "bg-brass-100 text-brass-700 border border-[var(--mcv-line-brass)]" :
                                        replies.length > 0 ? "bg-brass-100 text-brass-700 hover:bg-brass-100" :
                                        "bg-surface border border-border-dim text-text-secondary hover:border-[var(--mcv-line-brass)] hover:text-brass-700"
                                    )}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" />
                                            <span>Creating replies...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare size={13} />
                                            <span>{replies.length > 0 ? `${replies.length} Replies` : "Create Replies"}</span>
                                            {replies.length > 0 && (isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </>
                                    )}
                                </button>

                                {replies.length > 0 && (
                                    <button
                                        onClick={() => handleGenerate(post)}
                                        disabled={isLoading}
                                        className="flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-brass-700 transition-colors"
                                    >
                                        <RefreshCw size={11} />
                                        <span>Regenerate</span>
                                    </button>
                                )}
                            </div>

                            {/* Replies */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden border-t border-border-dim/15"
                                    >
                                        <div id={`generation-results-${post.id}`} className="p-4 scroll-mt-24">
                                            {isLoading ? (
                                                null
                                            ) : (
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                                    {replies.map((reply, rIdx) => {
                                                        const labels = ["Short & Direct", "Detailed Value", "Curiosity Hook"];
                                                        const uniqueId = `${post.id}-${rIdx}`;
                                                        const isCopied = copiedId === uniqueId;

                                                        return (
                                                            <div key={rIdx} className="flex flex-col surface-nested border-border-dim/20 p-4 hover:border-[var(--mcv-line-brass)] transition-all group">
                                                                <div className="flex items-center justify-between mb-2.5">
                                                                    <span className="text-[13px] font-medium text-brass-700 uppercase tracking-widest">{labels[rIdx]}</span>
                                                                    <button
                                                                        onClick={() => handleCopy(reply, uniqueId)}
                                                                        className={clsx(
                                                                            "flex items-center gap-1 px-2 py-1 rounded text-[13px] font-medium transition-all",
                                                                            isCopied
                                                                                ? "bg-success text-white"
                                                                                : "bg-page border border-border-dim text-text-muted hover:bg-grad-brass hover:text-black hover:border-[var(--mcv-line-brass)]"
                                                                        )}
                                                                    >
                                                                        {isCopied ? <Check size={10} /> : <Copy size={10} />}
                                                                        <span>{isCopied ? "Copied!" : "Copy"}</span>
                                                                    </button>
                                                                </div>
                                                                <p className="text-[13px] text-text-secondary leading-relaxed group-hover:text-text-primary transition-colors">
                                                                    {renderFormattedReply(reply)}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between pt-4 border-t border-border-dim/20">
                <button
                    onClick={() => router.push("/radar")}
                    className="flex items-center gap-2 text-[13px] font-medium text-text-muted hover:text-brass-700 transition-colors"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Step 3</span>
                </button>
                <p className="text-[13px] text-text-muted">
                    Copy a reply → paste it under the ad → include your link → earn commissions
                </p>
            </div>
        </motion.div>
    );
}
