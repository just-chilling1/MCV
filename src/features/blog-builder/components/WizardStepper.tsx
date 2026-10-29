"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import { WIZARD_STEPS } from "../types";

interface WizardStepperProps {
  currentStep: number;
  className?: string;
}

export function WizardStepper({ currentStep, className }: WizardStepperProps) {
  return (
    <nav aria-label="Site builder progress" className={clsx("wizard-progress", className)}>
      <ol className="flex w-full items-start">
        {WIZARD_STEPS.map((step, index) => {
          const isComplete = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <Fragment key={step.number}>
              <li className="flex min-w-0 flex-1 flex-col items-center px-0.5 text-center sm:px-1">
                <div
                  className={clsx(
                    "wizard-step-badge",
                    isActive && "is-active",
                    isComplete && "is-complete",
                    !isComplete && !isActive && "is-pending"
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isComplete ? <Check size={16} strokeWidth={2.5} aria-hidden /> : step.number}
                </div>
                <p
                  className={clsx(
                    "mt-2 line-clamp-2 text-[13px] font-medium leading-tight sm:text-xs sm:leading-snug md:text-sm",
                    isActive
                      ? "text-text-heading"
                      : isComplete
                        ? "text-text-primary"
                        : "text-text-muted"
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={clsx(
                    "mt-0.5 hidden text-[13px] leading-snug sm:block sm:text-xs",
                    isActive ? "text-text-secondary" : isComplete ? "text-text-muted" : "text-text-muted/80"
                  )}
                >
                  {step.description}
                </p>
              </li>

              {index < WIZARD_STEPS.length - 1 && (
                <li
                  aria-hidden
                  className={clsx(
                    "wizard-step-connector",
                    currentStep > step.number ? "is-complete" : "is-pending"
                  )}
                />
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
