"use client";

interface AiLoadingBarProps {
  label?: string;
  className?: string;
  /** 0–100 for determinate progress; omit for indeterminate sweep */
  progress?: number;
  /** Pulse + sweep while work is in progress (even if % is unchanged). */
  active?: boolean;
  /** Optional estimated time remaining, e.g. "~1 min left" */
  eta?: string;
}

export function AiLoadingBar({
  label,
  className = "",
  progress,
  active = false,
  eta,
}: AiLoadingBarProps) {
  const determinate = typeof progress === "number";
  const clamped = determinate ? Math.min(100, Math.max(0, progress)) : 0;
  const showActivity = active || !determinate;

  return (
    <div className={`flex min-w-0 max-w-full flex-col gap-2.5 ${className}`} role="status" aria-live="polite">
      <div className="flex min-w-0 items-center justify-between gap-3">
        {label && (
          <p className="flex min-w-0 items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em] text-brass-700">
            {showActivity && (
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full bg-grad-brass ai-loading-pulse-dot"
                aria-hidden
              />
            )}
            <span className="truncate">{label}</span>
          </p>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {eta && (
            <span className="hidden text-[13px] font-medium text-text-muted sm:inline">{eta}</span>
          )}
          {determinate && (
            <p className="text-sm font-medium tabular-nums text-brass-700">{clamped}%</p>
          )}
        </div>
      </div>
      <div className="ai-loading-track relative isolate h-2.5 w-full min-w-0 overflow-hidden rounded-full border border-[var(--mcv-line-brass)]/60 bg-brass-100/80">
        {determinate ? (
          <div
            className={`ai-loading-fill absolute inset-y-0 left-0 rounded-full bg-grad-brass${showActivity ? " ai-loading-fill--active" : ""}`}
            style={{ width: `${clamped}%` }}
          />
        ) : null}
        {showActivity && (
          <div
            className={`ai-loading-beam absolute inset-y-0 rounded-full${determinate ? " ai-loading-beam--overlay" : ""}`}
          />
        )}
      </div>
    </div>
  );
}
