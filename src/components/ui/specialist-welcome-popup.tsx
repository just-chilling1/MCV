"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock3, FastForward, Phone, TrendingUp, Vault, X } from "lucide-react";
import { brand } from "@/config/brand.config";

const SESSION_DISMISS_KEY = "mcv_specialist_popup_dismissed";
const COUNTDOWN_MS = 10 * 60 * 1000;
const PHONE_DISPLAY = "425-458-1656";
const PHONE_TEL = "tel:+14254581656";

const BENEFITS = [
  { icon: FastForward, text: "Skip all the learning curve and all the wait" },
  { icon: Clock3, text: "Get results from day zero" },
  { icon: TrendingUp, text: "Scale your results to $1,000 - $2,000 per day" },
] as const;

type EligibilityResponse = {
  eligible: boolean;
  country: string | null;
  closesInMs?: number;
};

type TrackEvent = "cta_call_click" | "popup_open";

function trackPopupEvent(event: TrackEvent) {
  try {
    const payload = JSON.stringify({ event });
    const sent = navigator.sendBeacon?.(
      "/api/track/specialist-popup",
      new Blob([payload], { type: "text/plain" })
    );
    if (!sent) {
      fetch("/api/track/specialist-popup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // ignore
  }
}

function subscribeNoop() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

type SpecialistWelcomePopupProps = {
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SpecialistWelcomePopup({
  forceOpen = false,
  onOpenChange,
}: SpecialistWelcomePopupProps) {
  const titleId = useId();
  const isClient = useIsClient();
  const reduceMotion = useReducedMotion();
  const [eligibleOpen, setEligibleOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [remainingMs, setRemainingMs] = useState(COUNTDOWN_MS);
  const [windowClosesInMs, setWindowClosesInMs] = useState<number | null>(null);
  const open = !dismissed && (forceOpen || eligibleOpen);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!isClient || forceOpen) return;

    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === "1") return;
    } catch {
      // sessionStorage may be blocked
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/eligibility/specialist-popup", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok || cancelled) return;

        const data = (await res.json()) as EligibilityResponse;
        if (cancelled || !data.eligible) return;

        setRemainingMs(COUNTDOWN_MS);
        setWindowClosesInMs(
          typeof data.closesInMs === "number" ? data.closesInMs : null
        );
        setEligibleOpen(true);
        trackPopupEvent("popup_open");
      } catch {
        // never show on failure
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [forceOpen, isClient]);

  useEffect(() => {
    if (!eligibleOpen || forceOpen || windowClosesInMs == null) return;
    const id = window.setTimeout(
      () => setEligibleOpen(false),
      Math.max(0, windowClosesInMs)
    );
    return () => window.clearTimeout(id);
  }, [eligibleOpen, forceOpen, windowClosesInMs]);

  useEffect(() => {
    if (!eligibleOpen || forceOpen) return;

    const revalidate = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/eligibility/specialist-popup", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as EligibilityResponse;
        if (!data.eligible) setEligibleOpen(false);
      } catch {
        // keep current state
      }
    };

    document.addEventListener("visibilitychange", revalidate);
    return () => document.removeEventListener("visibilitychange", revalidate);
  }, [eligibleOpen, forceOpen]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    if (forceOpen) return;
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }, [forceOpen]);

  const trackCallClick = useCallback(() => {
    trackPopupEvent("cta_call_click");
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    },
    [dismiss]
  );

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
    };

    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      style.overflow = prev.overflow;
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      style.width = prev.width;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (!open) return;

    const startedAt = Date.now();
    const tick = () => {
      setRemainingMs(Math.max(0, COUNTDOWN_MS - (Date.now() - startedAt)));
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [open]);

  if (!isClient) return null;

  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  const progressPct = (remainingMs / COUNTDOWN_MS) * 100;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Close welcome offer"
            className="absolute inset-0 bg-black/30"
            onClick={dismiss}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            key="specialist-welcome-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-[24.5rem] sm:max-w-[52rem] max-sm:rounded-t-3xl sm:rounded-3xl bg-raised shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            onClick={(e) => e.stopPropagation()}
            initial={
              reduceMotion ? false : { opacity: 0, y: 36, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion ? undefined : { opacity: 0, y: 24, scale: 0.97 }
            }
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
          >
            <div className="relative flex max-h-[min(96dvh,46rem)] flex-col overflow-hidden max-sm:rounded-t-3xl sm:rounded-3xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(80%_100%_at_50%_0%,rgba(16,185,129,0.07),transparent_75%)]"
              />

              <div className="relative z-10 flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-4">
                {brand.logo.type === "image" && brand.logo.iconSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo.iconSrc}
                    alt={brand.productName}
                    className="h-9 w-9 rounded-xl object-contain shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:h-10 sm:w-10"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brass-500 text-[var(--color-text-on-accent)] shadow-[0_4px_12px_rgba(212,175,55,0.3)]">
                    <Vault size={16} strokeWidth={2.4} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Close"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-ink-4 transition-colors hover:bg-brass-100 hover:text-ink active:bg-brass-200 touch-manipulation"
                >
                  <X size={18} />
                </button>
              </div>

              <div
                className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-2 pt-1 sm:grid sm:grid-cols-[1fr_1.05fr] sm:items-center sm:gap-x-10 sm:px-10 sm:pb-5 sm:pt-2"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div>
                  <p className="text-center text-[12px] font-bold uppercase tracking-[0.3em] text-ink-4 sm:text-left sm:text-[13px]">
                    Welcome To
                  </p>
                  <h2
                    id={titleId}
                    className="brand-font mt-1 text-center text-[1.65rem] font-black leading-none tracking-tight text-ink sm:text-left sm:text-[2.2rem]"
                  >
                    {brand.productName}
                  </h2>

                  <div className="mx-auto mt-3 max-w-[22rem] space-y-0.5 text-center text-[14px] leading-[1.5] text-ink-2 sm:mx-0 sm:mt-4 sm:max-w-none sm:space-y-1 sm:text-left sm:text-[15.5px] sm:leading-[1.6]">
                    <p>
                      As part of our commitment to{" "}
                      <span className="font-bold text-ink">YOUR</span> success…
                    </p>
                    <p>…And to fast-track your results and skip the learning curve.</p>
                  </div>
                  <p className="mx-auto mt-2 max-w-[20rem] text-center text-[16px] font-bold leading-snug text-ink sm:mx-0 sm:mt-3 sm:max-w-none sm:text-left sm:text-[19px]">
                    You have been assigned a dedicated Start-Up Specialist.
                  </p>
                </div>

                <div className="sm:border-l sm:border-border-dim sm:pl-10">
                  <div className="mx-auto mt-3.5 max-w-[22rem] sm:mx-0 sm:mt-0 sm:max-w-none">
                    <p className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-ink-4 sm:text-[12px]">
                      Who will help you
                    </p>
                    <ul className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2.5">
                      {BENEFITS.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brass-100 text-success sm:h-10 sm:w-10 sm:rounded-xl">
                            <Icon
                              size={16}
                              strokeWidth={2.2}
                              className="sm:hidden"
                            />
                            <Icon
                              size={19}
                              strokeWidth={2.2}
                              className="hidden sm:block"
                            />
                          </span>
                          <span className="text-[14.5px] font-semibold leading-snug text-ink sm:text-[15.5px]">
                            {text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mx-auto mt-2.5 flex max-w-[22rem] items-center gap-3 rounded-2xl border border-border-dim bg-field px-3.5 py-2.5 sm:mx-0 sm:mt-4 sm:max-w-none sm:px-4 sm:py-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] sm:h-12 sm:w-12">
                      <Vault
                        size={22}
                        strokeWidth={1.8}
                        className="text-success sm:hidden"
                      />
                      <Vault
                        size={26}
                        strokeWidth={1.8}
                        className="hidden text-success sm:block"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-black uppercase tracking-[0.18em] text-success sm:text-[11px]">
                        Plus
                      </p>
                      <p className="mt-0.5 text-[14px] font-bold leading-snug text-ink sm:text-[15px]">
                        He will unlock our secret vault bonuses for you for FREE
                      </p>
                      <p className="mt-0.5 text-[13px] text-ink-2 sm:text-[14px]">
                        Worth over{" "}
                        <span className="font-bold text-ink tabular-nums">
                          $11,385.32
                        </span>{" "}
                        in retail value
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 shrink-0 border-t border-border-dim bg-field px-6 pt-3 pb-[max(1.15rem,env(safe-area-inset-bottom))] sm:px-10 sm:pt-4 sm:pb-5">
                <div className="sm:flex sm:items-center sm:gap-8">
                  <div className="mx-auto max-w-[22rem] sm:mx-0 sm:max-w-none sm:flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-ink-2 sm:text-[12px]">
                        Your code expires in
                      </span>
                      <span className="brand-font rounded-lg bg-brass-100 px-2 py-1 text-[1.25rem] font-black leading-none tabular-nums text-error sm:text-[1.5rem]">
                        {mm}:{ss}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-brass-200">
                      <div
                        className="h-full rounded-full bg-brass-1000 transition-[width] duration-300 ease-linear"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <a
                    href={PHONE_TEL}
                    onClick={trackCallClick}
                    className="group relative mt-3 flex w-full min-h-[58px] items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-brass-500 px-5 text-[var(--color-text-on-accent)] transition-all hover:bg-[var(--mcv-brand-hover)] active:scale-[0.985] touch-manipulation select-none motion-safe:animate-[cta-pulse-green_2.2s_ease-in-out_infinite] shadow-[0_8px_24px_rgba(212,175,55,0.35)] sm:mt-0 sm:w-auto sm:min-w-[19rem] sm:flex-1 sm:min-h-[62px]"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-white/20 blur-md motion-safe:animate-[sheen_3s_ease-in-out_infinite]"
                    />
                    <Phone size={20} strokeWidth={2.4} className="shrink-0" />
                    <span className="flex flex-col items-start leading-none">
                      <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] opacity-95">
                        Call now · tap to call
                      </span>
                      <span className="brand-font mt-[3px] text-[1.4rem] font-black tabular-nums tracking-tight sm:text-[1.55rem]">
                        {PHONE_DISPLAY}
                      </span>
                    </span>
                  </a>
                </div>

                <p className="mx-auto mt-2.5 max-w-[22rem] text-center text-[12px] leading-[1.55] text-ink-4 sm:mt-3 sm:max-w-none sm:text-[12.5px]">
                  Call immediately to finalize your setup and claim your Secret Vault Code.
                  (Your temporary code expires when this page closes. Call within the next 10
                  minutes to secure your bonuses!)
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
