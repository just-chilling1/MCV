"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2, Check, ExternalLink, ArrowLeft, Search, Radar,
    Sparkles, ArrowRight
} from "lucide-react";
import { useSearch, Ad } from "@/features/core-workflow/context/SearchContext";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { GenerationProgress, GENERATION_RESULTS_ID } from "@/components/ui/generation-progress";

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

function AdCard({
    post, isSelected, onToggle,
}: {
    post: Ad; isSelected: boolean; onToggle: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onToggle}
            className={clsx(
                "select-card p-4 cursor-pointer relative",
                isSelected && "is-selected"
            )}
        >
            {isSelected && (
                <span className="select-check-badge select-check-badge--corner" aria-hidden>
                    <Check size={16} strokeWidth={3} />
                </span>
            )}

            <div className="flex flex-col gap-2.5 pr-10">
                <div className="flex items-center gap-2">
                    <PlatformBadge platform={post.platform} />
                    <span className="text-[13px] text-text-muted font-medium">
                        {typeof post.engagement === 'number'
                            ? `${post.engagement.toLocaleString()} engagements`
                            : post.engagement}
                    </span>
                </div>
                <p className="text-[13px] text-text-primary leading-relaxed font-medium line-clamp-3">
                    {post.text || post.title}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border-dim/15">
                    <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[13px] text-text-muted hover:text-brass-700 transition-colors"
                    >
                        <ExternalLink size={10} />
                        <span>View original</span>
                    </a>
                    <span className={clsx(
                        "text-[13px] font-medium uppercase tracking-widest",
                        isSelected ? "text-brass-700" : "text-text-muted"
                    )}>
                        {isSelected ? "✓ Selected" : "Click to select"}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export default function RadarPage() {
    const {
        variations, activeChip, setActiveChip,
        postsByVariation, setPostsByVariation,
        selectedAds, setSelectedAds
    } = useSearch();

    const [loadingChip, setLoadingChip] = useState<string | null>(null);
    const router = useRouter();

    const currentPosts = postsByVariation[activeChip] || [];

    const fetchPostsForChip = async (chip: string) => {
        setLoadingChip(chip);
        try {
            const resp = await fetch("/api/jackpots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword: chip.trim() })
            });
            if (resp.ok) {
                const data = await resp.json();
                setPostsByVariation({ ...postsByVariation, [chip]: data.results || [] });
            }
        } catch (e) {
            console.error("Fetch ads failed:", e);
        } finally {
            setLoadingChip(null);
        }
    };

    useEffect(() => {
        if (activeChip && (!postsByVariation[activeChip] || postsByVariation[activeChip].length === 0) && !loadingChip) {
            fetchPostsForChip(activeChip);
        }
    }, [activeChip]);

    const togglePostSelection = (post: Ad) => {
        const isAlreadySelected = selectedAds.some(p => p.id === post.id);
        if (isAlreadySelected) {
            setSelectedAds(selectedAds.filter(p => p.id !== post.id));
        } else {
            setSelectedAds([...selectedAds, post]);
        }
    };

    if (variations.length === 0) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-14 h-14 rounded-xl bg-surface flex items-center justify-center border border-border-dim">
                    <Search size={24} className="text-text-muted" />
                </div>
                <div className="text-center flex flex-col gap-2">
                    <h2 className="text-xl font-medium text-text-primary">Start with Step 1</h2>
                    <p className="text-sm text-text-muted">Enter a topic first so we can find ads for you.</p>
                </div>
                <button onClick={() => router.push("/search")} className="btn-primary">
                    <Search size={16} />
                    <span>Go to Step 1</span>
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
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brass-100 border border-[var(--mcv-line-brass)] flex items-center justify-center rounded-lg">
                        <Radar size={20} className="text-brass-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl text-text-primary font-medium tracking-tight">Step 3: Find Ads</h1>
                        <p className="text-sm text-text-muted">
                            Click ads to select them, then create replies in the next step.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end px-3 border-r border-border-dim/30">
                        <span className="text-[13px] font-medium text-text-muted uppercase tracking-widest">Selected</span>
                        <span className="text-lg font-medium text-brass-700 tabular-nums">{selectedAds.length}</span>
                    </div>
                    <button
                        onClick={() => router.push("/replies")}
                        disabled={selectedAds.length === 0}
                        className={clsx(
                            "btn-primary h-10 px-5 text-sm rounded-lg group",
                            selectedAds.length === 0 && "opacity-40 grayscale pointer-events-none"
                        )}
                    >
                        <span>Step 4: Create Replies</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </header>

            {/* Keyword chips */}
            <div className="flex flex-wrap gap-2">
                {variations.map((v) => (
                    <button
                        key={v}
                        onClick={() => setActiveChip(v)}
                        className={clsx("select-chip", activeChip === v && "is-selected")}
                    >
                        {v}
                    </button>
                ))}
            </div>

            <GenerationProgress
                active={loadingChip !== null}
                label={loadingChip ? `Finding ads for "${loadingChip}"...` : "Finding ads..."}
            />

            {/* Ads grid */}
            <div id={GENERATION_RESULTS_ID} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24">
                <AnimatePresence mode="popLayout">
                    {loadingChip === activeChip ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={`skel-${i}`} className="h-36 rounded-xl border border-border-dim/20 bg-surface/20 animate-pulse" />
                        ))
                    ) : currentPosts.length > 0 ? (
                        currentPosts.map((post) => (
                            <AdCard
                                key={post.id}
                                post={post}
                                isSelected={selectedAds.some(p => p.id === post.id)}
                                onToggle={() => togglePostSelection(post)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3 border border-dashed border-border-dim/30 rounded-xl">
                            <Search size={32} className="text-text-muted/20" />
                            <p className="text-sm text-text-muted font-medium">No ads found for &ldquo;{activeChip}&rdquo;</p>
                            <p className="text-[13px] text-text-muted">Try clicking a different keyword above.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between pt-4 border-t border-border-dim/20">
                <button
                    onClick={() => router.push("/analysis")}
                    className="flex items-center gap-2 text-[13px] font-medium text-text-muted hover:text-brass-700 transition-colors"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Step 2</span>
                </button>
                {selectedAds.length > 0 && (
                    <p className="text-[13px] text-text-muted">
                        <strong className="text-brass-700">{selectedAds.length}</strong> ad{selectedAds.length !== 1 ? "s" : ""} ready for replies
                    </p>
                )}
            </div>
        </motion.div>
    );
}
