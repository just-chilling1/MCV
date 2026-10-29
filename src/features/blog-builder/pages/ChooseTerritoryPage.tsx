"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MapPin, Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/page-header";
import { WizardStepBar } from "@/components/ui/wizard-step-bar";
import { PageLoading } from "@/components/ui/page-loading";
import { WizardStepper } from "../components/WizardStepper";
import { useBlogBuilder } from "../context/BlogBuilderContext";
import { NICHE_OPTIONS } from "../types";
import type { WizardStepProps } from "../lib/wizard-step-props";

export default function ChooseTerritoryPage({ embedded, onContinue, onBack }: WizardStepProps = {}) {
  const router = useRouter();
  const { sessionLoaded, linksArmed, niche, chooseTerritory } = useBlogBuilder();
  const [selected, setSelected] = useState(niche);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (embedded) return;
    if (sessionLoaded && !linksArmed) {
      router.replace("/sales-offer-generator");
    }
  }, [embedded, sessionLoaded, linksArmed, router]);

  useEffect(() => {
    if (niche) setSelected(niche);
  }, [niche]);

  const handleContinue = () => {
    if (!selected) {
      setError("Please select a niche for your website.");
      return;
    }

    setError(null);
    setLoading(true);
    const label = NICHE_OPTIONS.find((n) => n.value === selected)?.label ?? selected;
    chooseTerritory(selected, label);
    if (onContinue) {
      onContinue();
    } else {
      router.push("/theme");
    }
  };

  if (!sessionLoaded) {
    return <PageLoading message="Loading your session..." />;
  }

  return (
    <div className={embedded ? "space-y-4" : "wizard-shell w-full"}>
      {!embedded && (
        <>
          <WizardStepBar breadcrumb="Site Builder / Niche" step={2} />
          <PageHeader
            eyebrow="Step 2"
            title="Pick Your Niche"
            subtitle="Choose one of nine niches. We'll build a questionnaire about that topic — your affiliate link appears on the final page."
          />
          <WizardStepper currentStep={2} />
        </>
      )}

      <section className="wizard-panel animate-fade-in-up">
        <div className="wizard-panel-header">
          <div className="wizard-panel-icon">
            <MapPin size={18} />
          </div>
          <div>
            <h2 className="ds-h4">Select a niche</h2>
            <p className="mt-0.5 text-sm text-text-secondary">Choose the topic your questionnaire will cover.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NICHE_OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSelected(option.value);
                  setError(null);
                }}
                className={clsx("wizard-selection-card select-card", isSelected && "is-selected")}
              >
                {isSelected && (
                  <span className="wizard-selection-card-check select-check-badge" aria-hidden>
                    <Check size={20} strokeWidth={3} />
                  </span>
                )}
                <p className="wizard-selection-card-label select-card-label">{option.label}</p>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

        <div className="wizard-action-bar mt-4">
          <button
            type="button"
            onClick={() => (onBack ? onBack() : router.push("/sales-offer-generator"))}
            className="btn-subtle sm:min-w-[8rem]"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading || !selected}
            className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Continue to Template
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
