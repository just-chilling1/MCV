"use client";

import {
  ArrowRight,
  Globe,
  LayoutTemplate,
  Link2,
  Rocket,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";

interface DeployLaunchPanelProps {
  nicheLabel: string;
  templateName: string;
  linkCount: number;
  quotaRemaining?: number | null;
  quotaLimit?: number | null;
  quotaUnlimited?: boolean;
  canResume?: boolean;
  resumeLabel?: string;
  error?: string | null;
  onLaunch: () => void;
  onResume: () => void;
  onRetry?: () => void;
  phase: "idle" | "error";
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Globe;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-[var(--mcv-line)] bg-[var(--mcv-surface-field)] px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brass-100">
        <Icon size={16} className="text-brass-700" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium tracking-[0.06em] text-ink-5">{label}</p>
        <p className="truncate text-[15px] font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

export function DeployLaunchPanel({
  nicheLabel,
  templateName,
  linkCount,
  quotaRemaining,
  quotaLimit,
  quotaUnlimited,
  canResume,
  resumeLabel,
  error,
  onLaunch,
  onResume,
  onRetry,
  phase,
}: DeployLaunchPanelProps) {
  const quotaBlocked =
    !quotaUnlimited && quotaRemaining !== null && quotaRemaining !== undefined && quotaRemaining <= 0;

  const primaryAction = phase === "error" ? onRetry : canResume ? onResume : onLaunch;
  const primaryLabel =
    phase === "error"
      ? "Try Deploy Again"
      : canResume
        ? resumeLabel || "Continue Deployment"
        : "Launch My Questionnaire Site";
  const PrimaryIcon = phase === "error" || canResume ? RotateCcw : Rocket;

  return (
    <section className="wizard-panel overflow-hidden p-0 animate-fade-in-up">
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="wizard-panel-icon h-10 w-10">
            <Sparkles size={20} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="ds-h3">
              {phase === "error" ? "Deployment interrupted" : "Ready to launch"}
            </h2>
            <p className="text-[15px] leading-relaxed text-ink-3">
              {phase === "error"
                ? "Something went wrong while building your site. Review the message below and try again."
                : "Your niche, template, and affiliate link are locked in. One click builds a questionnaire site with your offer on the final page."}
            </p>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <SummaryRow icon={Globe} label="Niche" value={nicheLabel} />
          <SummaryRow icon={LayoutTemplate} label="Template" value={templateName} />
          <SummaryRow
            icon={Link2}
            label="Affiliate links"
            value={`${linkCount} link${linkCount === 1 ? "" : "s"} armed`}
          />
        </div>

        {phase === "idle" && !quotaUnlimited && quotaLimit != null && quotaRemaining != null && (
          <p className="text-[13px] text-ink-5">
            {quotaRemaining} of {quotaLimit} new websites remaining today
          </p>
        )}

        {error && <p className="alert-error">{error}</p>}
      </div>

      <div className="border-t border-[var(--mcv-line)] bg-canvas px-5 py-4 sm:px-6 sm:py-5">
        <button
          type="button"
          onClick={primaryAction}
          disabled={phase === "idle" && !canResume && quotaBlocked}
          className={clsx(
            "btn-primary w-full",
            (canResume || phase === "error") && "border border-[var(--mcv-line-brass)]"
          )}
        >
          <PrimaryIcon size={20} strokeWidth={1.75} />
          {primaryLabel}
          {phase === "idle" && !canResume && <ArrowRight size={20} strokeWidth={1.75} />}
        </button>
      </div>
    </section>
  );
}
