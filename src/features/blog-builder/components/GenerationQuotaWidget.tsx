"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { GenerationQuota } from "../types";

export function GenerationQuotaWidget({ className = "" }: { className?: string }) {
  const [quota, setQuota] = useState<GenerationQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog/quota", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.quota) setQuota(data.quota as GenerationQuota);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className={`surface-inset p-4 flex items-center gap-3 ${className}`}
      >
        <Loader2 className="animate-spin text-brass-700" size={18} />
        <span className="text-sm text-text-muted">Loading generations…</span>
      </div>
    );
  }

  if (!quota) return null;

  if (quota.unlimited) {
    return (
      <div
        className={`rounded-xl border border-[var(--mcv-line-brass)] bg-gradient-to-br from-brass-100 to-page/60 shadow-brass p-4 sm:p-5 flex items-center gap-4 ${className}`}
      >
        <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-brass-100 text-brass-700">
          <Sparkles size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium uppercase tracking-widest text-text-muted">
            Money-site generations
          </p>
          <p className="text-xl sm:text-2xl font-medium text-brass-700">Unlimited</p>
          <p className="text-xs text-text-muted leading-relaxed mt-0.5">
            Society Upgrade active · {quota.usedToday} generated today.
          </p>
        </div>
      </div>
    );
  }

  const limit = quota.limit ?? 0;
  const remaining = quota.remaining ?? 0;
  const pct = limit > 0 ? Math.round((remaining / limit) * 100) : 0;
  const depleted = remaining <= 0;

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${ depleted ? "border-[var(--mcv-line-brass)] bg-brass-100/5" : "border-[var(--mcv-line-brass)] bg-gradient-to-br from-brass-100 to-page/60" } ${className}`}
    >
      <div
        className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${ depleted ? "bg-brass-100/15 text-brass-700" : "bg-brass-100 text-brass-700" }`}
      >
        <Sparkles size={22} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[13px] font-medium uppercase tracking-widest text-text-muted">
            Daily money-site generations
          </p>
          <p
            className={`text-2xl sm:text-3xl font-medium tabular-nums ${ depleted ? "text-brass-700" : "text-brass-700" }`}
          >
            {remaining}
            <span className="text-base font-medium text-text-muted"> / {limit}</span>
          </p>
        </div>

        <div className="h-2 rounded-full bg-black/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${ depleted ? "bg-brass-100/70" : "bg-grad-brass" }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          {depleted ? (
            <>You&apos;ve used all {limit} generations today. Resets at midnight UTC.</>
          ) : (
            <>
              {remaining} {remaining === 1 ? "generation" : "generations"} left today
              {quota.usedToday > 0 && (
                <>
                  {" "}
                  · {quota.usedToday} already used
                </>
              )}
              . Resets at midnight UTC.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
