"use client";

import Link from "next/link";
import { LucideIcon, ArrowRight, Check, Info } from "lucide-react";
import { clsx } from "clsx";
import { useWorkflowNav } from "@/context/WorkflowNavContext";
import { getDashboardStepStatuses, type DashboardStepStatus } from "@/lib/dashboard-steps";

export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  minutes: string;
  href: string;
  icon: LucideIcon;
  cta: string;
}

interface HowItWorksProps {
  steps: HowItWorksStep[];
  title?: string;
  subtitle?: string;
}

function StepBadge({
  number,
  status,
}: {
  number: number;
  status: DashboardStepStatus;
}) {
  if (status === "completed") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-success/30 bg-success/100/15 text-success">
        <Check size={18} strokeWidth={2.5} aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
        status === "current"
          ? "border-2 border-[var(--mcv-line-brass)] bg-grad-brass text-text-on-accent shadow-brass"
          : "border border-border-dim bg-brass-100 text-text-muted"
      )}
    >
      {number}
    </div>
  );
}

export function HowItWorks({
  steps,
  title = "Here's how it works",
  subtitle = "Three steps to launch, promote, and earn from your offers.",
}: HowItWorksProps) {
  const { progress } = useWorkflowNav();
  const stepStatuses = getDashboardStepStatuses(progress);

  return (
    <section className="dashboard-container animate-fade-in-up">
      <div className="dashboard-section-header">
        <div className="min-w-0">
          <h2 className="ds-h2">{title}</h2>
          <p className="ds-subtitle mt-2">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const status = stepStatuses[index] ?? "upcoming";
          const isCurrent = status === "current";
          const isCompleted = status === "completed";
          const isUpcoming = status === "upcoming";
          const showStartHere = step.number === 1 && isCurrent;

          return (
            <div
              key={step.number}
              className={clsx(
                "dashboard-nested-card flex h-full flex-col animate-stagger-item transition-all duration-200",
                isCurrent && "border-[var(--mcv-line-brass)] bg-white ring-2 ring-brass-100 shadow-brass",
                isUpcoming && "opacity-60 saturate-[0.85]",
                isCompleted && "border-success/20 bg-success/10"
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center gap-2.5">
                <StepBadge number={step.number} status={status} />
                <span className="rounded-full bg-grad-brass px-2.5 py-1 text-[13px] font-medium uppercase tracking-wider text-text-on-accent">
                  {step.minutes}
                </span>
                {showStartHere ? (
                  <span className="ml-auto rounded-full bg-brass-100 px-2.5 py-1 text-[13px] font-medium uppercase tracking-wider text-brass-700">
                    Start Here
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex items-center gap-2">
                <Icon
                  size={18}
                  className={clsx(
                    "shrink-0",
                    isCurrent ? "text-brass-700" : isCompleted ? "text-success" : "text-text-muted"
                  )}
                />
                <h3 className={clsx("ds-h3", isUpcoming && "text-text-secondary")}>{step.title}</h3>
              </div>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">{step.description}</p>

              <Link
                href={step.href}
                className={clsx(
                  "mt-5 w-full min-h-[48px]",
                  isCurrent ? "btn-primary" : "btn-secondary",
                  isUpcoming && "border-border-dim/80 bg-page text-text-secondary"
                )}
              >
                {isCompleted ? "Review" : step.cta}
                <ArrowRight size={16} />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex gap-3 rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 p-5 sm:p-6">
        <Info size={18} className="mt-0.5 shrink-0 text-brass-700" aria-hidden />
        <p className="text-sm leading-relaxed text-text-secondary">
          Follow the steps above to launch your first offer. If you get stuck, use the Support card in
          the sidebar.{" "}
          <span className="text-text-muted italic">Individual results vary.</span>
        </p>
      </div>
    </section>
  );
}
