"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { storageKeys } from "@/lib/storage-keys";

export interface Ad {
    id: string;
    platform: string;
    text: string;
    title?: string;
    url: string;
    engagement: string | number;
}

export interface AnalysisData {
    level: string;
    count: number;
    type?: string;
    classification: string;
    confidence?: number;
    sources?: number;
    liveData?: boolean;
}

interface SearchContextType {
    keyword: string;
    setKeyword: (k: string) => void;
    variations: string[];
    setVariations: (v: string[]) => void;
    activeChip: string;
    setActiveChip: (c: string) => void;
    postsByVariation: Record<string, Ad[]>;
    setPostsByVariation: (p: Record<string, Ad[]>) => void;
    activityByVariation: Record<string, string>;
    setActivityByVariation: (a: Record<string, string>) => void;
    analysisByVariation: Record<string, AnalysisData>;
    setAnalysisByVariation: (a: Record<string, AnalysisData>) => void;
    affiliateLink: string;
    setAffiliateLink: (l: string) => void;
    expandedPostId: string | null;
    setExpandedPostId: (id: string | null) => void;
    repliesByPostId: Record<string, string[]>;
    setRepliesByPostId: (r: Record<string, string[]>) => void;
    selectedAds: Ad[];
    setSelectedAds: (p: Ad[]) => void;
    history: string[];
    addToHistory: (k: string) => void;
    resetSession: () => Promise<void>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
    const [keyword, setKeyword] = useState("");
    const [variations, setVariations] = useState<string[]>([]);
    const [activeChip, setActiveChip] = useState("");
    const [postsByVariation, setPostsByVariation] = useState<Record<string, Ad[]>>({});
    const [activityByVariation, setActivityByVariation] = useState<Record<string, string>>({});
    const [analysisByVariation, setAnalysisByVariation] = useState<Record<string, AnalysisData>>({});
    const [affiliateLink, setAffiliateLink] = useState("");
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [repliesByPostId, setRepliesByPostId] = useState<Record<string, string[]>>({});
    const [selectedAds, setSelectedAds] = useState<Ad[]>([]);
    const [history, setHistory] = useState<string[]>([]);

    // Load history and last search state on mount
    useEffect(() => {
        const fetchHistoryAndState = async () => {
            try {
                // Restore from localStorage first for faster UI
                const savedKeyword = localStorage.getItem(storageKeys.workflowKeyword);
                const savedVariations = localStorage.getItem(storageKeys.workflowVariations);
                const savedChip = localStorage.getItem(storageKeys.workflowChip);
                const savedAffiliate = localStorage.getItem(storageKeys.workflowAffiliate);
                const savedSelected = localStorage.getItem(storageKeys.workflowSelectedPosts);

                if (savedKeyword) setKeyword(savedKeyword);
                if (savedVariations) setVariations(JSON.parse(savedVariations));
                if (savedChip) setActiveChip(savedChip);
                if (savedAffiliate) setAffiliateLink(savedAffiliate);
                if (savedSelected) setSelectedAds(JSON.parse(savedSelected));

                // Fetch real history from Supabase
                const { data: { user } } = await supabase.auth.getUser();
                const userId = user?.id;

                const historyQuery = supabase
                    .from("search_history")
                    .select("keyword")
                    .order("created_at", { ascending: false })
                    .limit(20);

                const { data, error } = userId
                    ? await historyQuery.eq("user_id", userId)
                    : await historyQuery;

                if (!error && data) {
                    const uniqueKeywords: string[] = [];
                    data.forEach(item => {
                        if (!uniqueKeywords.includes(item.keyword) && uniqueKeywords.length < 5) {
                            uniqueKeywords.push(item.keyword);
                        }
                    });
                    setHistory(uniqueKeywords);
                    localStorage.setItem(storageKeys.workflowHistory, JSON.stringify(uniqueKeywords));

                    // If we don't have a keyword in state, use the latest from history
                    if (!savedKeyword && uniqueKeywords[0]) {
                        const lastKeyword = uniqueKeywords[0];
                        setKeyword(lastKeyword);
                        localStorage.setItem(storageKeys.workflowKeyword, lastKeyword);

                        // Also try to fetch variations for this last keyword
                        const { data: vData } = await supabase
                            .from("keyword_variations")
                            .select("variations")
                            .eq("parent_keyword", lastKeyword)
                            .single();

                        if (vData?.variations) {
                            setVariations(vData.variations);
                            setActiveChip(vData.variations[0]);
                            localStorage.setItem(storageKeys.workflowVariations, JSON.stringify(vData.variations));
                            localStorage.setItem(storageKeys.workflowChip, vData.variations[0]);
                        }
                    }
                } else {
                    const savedHistory = localStorage.getItem(storageKeys.workflowHistory);
                    if (savedHistory) setHistory(JSON.parse(savedHistory));
                }
            } catch (e) {
                console.error("Error restoring state:", e);
                const savedHistory = localStorage.getItem(storageKeys.workflowHistory);
                if (savedHistory) setHistory(JSON.parse(savedHistory));
            }
        };
        fetchHistoryAndState();
    }, []);

    // Persist changes to localStorage
    useEffect(() => {
        if (keyword) localStorage.setItem(storageKeys.workflowKeyword, keyword);
        if (variations.length > 0) localStorage.setItem(storageKeys.workflowVariations, JSON.stringify(variations));
        if (activeChip) localStorage.setItem(storageKeys.workflowChip, activeChip);
        if (affiliateLink) localStorage.setItem(storageKeys.workflowAffiliate, affiliateLink);
        localStorage.setItem(storageKeys.workflowSelectedPosts, JSON.stringify(selectedAds));
    }, [keyword, variations, activeChip, affiliateLink, selectedAds]);

    const addToHistory = async (k: string) => {
        const newHistory = [k, ...history.filter(h => h !== k)].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem(storageKeys.workflowHistory, JSON.stringify(newHistory));
    };

    const resetSession = async () => {
        setKeyword("");
        setVariations([]);
        setActiveChip("");
        setPostsByVariation({});
        setActivityByVariation({});
        setAnalysisByVariation({});
        setAffiliateLink("");
        setExpandedPostId(null);
        setRepliesByPostId({});
        setSelectedAds([]);
        setHistory([]);
        localStorage.removeItem(storageKeys.workflowHistory);
        localStorage.removeItem(storageKeys.workflowSelectedPosts);
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <SearchContext.Provider value={{
            keyword, setKeyword,
            variations, setVariations,
            activeChip, setActiveChip,
            postsByVariation, setPostsByVariation,
            activityByVariation, setActivityByVariation,
            analysisByVariation, setAnalysisByVariation,
            affiliateLink, setAffiliateLink,
            expandedPostId, setExpandedPostId,
            repliesByPostId, setRepliesByPostId,
            selectedAds, setSelectedAds,
            history, addToHistory,
            resetSession
        }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error("useSearch must be used within a SearchProvider");
    }
    return context;
}
