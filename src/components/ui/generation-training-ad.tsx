"use client";

import { useEffect, useRef, useState } from "react";
import { EarningsBanner } from "./earnings-banner";

export const GENERATION_TRAINING_AD_ID = "generation-training-ad";

interface UseGenerationTrainingAdOptions {
  /** Keep the ad visible on completed/success views even if generation did not run in this session. */
  showWhenComplete?: boolean;
}

export function useGenerationTrainingAd(
  active: boolean,
  options: UseGenerationTrainingAdOptions = {}
) {
  const { showWhenComplete = false } = options;
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [bannerKey, setBannerKey] = useState(0);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (showWhenComplete) {
      setPinned(true);
    }
  }, [showWhenComplete]);

  useEffect(() => {
    if (active) {
      setPinned(true);
      setCompleted(false);
      setDismissed(false);
      setBannerKey((key) => key + 1);
    } else if (wasActiveRef.current) {
      setCompleted(true);
      setDismissed(false);
      setBannerKey((key) => key + 1);
    }
    wasActiveRef.current = active;
  }, [active]);

  const showBanner = pinned && !dismissed && (active || completed || showWhenComplete);

  const resetBanner = () => {
    setPinned(false);
    setDismissed(false);
    setCompleted(false);
  };

  return {
    showBanner,
    bannerKey,
    dismissBanner: () => setDismissed(true),
    resetBanner,
  };
}

interface GenerationTrainingAdProps {
  show: boolean;
  bannerKey: number;
  onDismiss: () => void;
  scrollIntoView?: boolean;
}

export function GenerationTrainingAd({
  show,
  bannerKey,
  onDismiss,
  scrollIntoView = true,
}: GenerationTrainingAdProps) {
  const scrolledKeyRef = useRef<number | null>(null);

  useEffect(() => {
    if (!show || !scrollIntoView) return;
    if (scrolledKeyRef.current === bannerKey) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById(GENERATION_TRAINING_AD_ID);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!inView) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      scrolledKeyRef.current = bannerKey;
    }, 120);

    return () => window.clearTimeout(timer);
  }, [show, bannerKey, scrollIntoView]);

  if (!show) return null;

  return (
    <div id={GENERATION_TRAINING_AD_ID} className="scroll-mt-24">
      <EarningsBanner key={bannerKey} prominent onDismiss={onDismiss} />
    </div>
  );
}
