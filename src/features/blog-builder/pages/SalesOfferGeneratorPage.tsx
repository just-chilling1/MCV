"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { WizardStepper } from "../components/WizardStepper";
import { useBlogBuilder } from "../context/BlogBuilderContext";
import type { WizardStepNumber } from "../lib/wizard-step-props";
const stepLoading = () => <PageSkeleton cards={1} className="mt-4" />;

const ArmLinksPage = dynamic(() => import("./ArmLinksPage"), { loading: stepLoading });
const ChooseTerritoryPage = dynamic(() => import("./ChooseTerritoryPage"), { loading: stepLoading });
const ChooseThemePage = dynamic(() => import("./ChooseThemePage"), { loading: stepLoading });
const DeployAssetPage = dynamic(() => import("./DeployAssetPage"), { loading: stepLoading });

const STEP_COPY: Record<
  WizardStepNumber,
  { eyebrow: string; title: string; subtitle: string }
> = {
  1: {
    eyebrow: "Step 1",
    title: "Add Your Link",
    subtitle:
      "Choose a saved link from your Links Library, or paste a new promotional or affiliate link. It will be placed on your generated sales page.",
  },
  2: {
    eyebrow: "Step 2",
    title: "Pick Your Niche",
    subtitle:
      "Choose one of nine niches. We'll build a questionnaire about that topic — your affiliate link appears on the final page.",
  },
  3: {
    eyebrow: "Step 3",
    title: "Choose a Template",
    subtitle:
      "Pick one of three templates, then customize the color theme and fonts for your niche questionnaire.",
  },
  4: {
    eyebrow: "Step 4",
    title: "Launch Your Offer",
    subtitle:
      "We generate niche-specific quiz questions and place your affiliate link on the final results page — then publish instantly.",
  },
};

function maxAccessibleStep(
  linksArmed: boolean,
  territoryChosen: boolean,
  themeChosen: boolean
): WizardStepNumber {
  if (themeChosen) return 4;
  if (territoryChosen) return 3;
  if (linksArmed) return 2;
  return 1;
}

type StepCompletionFlags = Partial<{
  linksArmed: boolean;
  territoryChosen: boolean;
  themeChosen: boolean;
}>;

export default function SalesOfferGeneratorPage() {
  const {
    sessionLoaded,
    linksArmed,
    territoryChosen,
    themeChosen,
    wizardUiStep,
    setWizardUiStep,
    startFreshOfferWizard,
  } = useBlogBuilder();

  const goToStep = (next: WizardStepNumber, justCompleted?: StepCompletionFlags) => {
    const maxStep = maxAccessibleStep(
      justCompleted?.linksArmed ?? linksArmed,
      justCompleted?.territoryChosen ?? territoryChosen,
      justCompleted?.themeChosen ?? themeChosen
    );
    setWizardUiStep(next <= maxStep ? next : maxStep);
  };

  const handleGenerateAnother = () => {
    startFreshOfferWizard();
    setWizardUiStep(1);
  };

  if (!sessionLoaded) {
    return (
      <div className="wizard-shell w-full">
        <PageHeader
          eyebrow="Sales Offer Generator"
          title="Launch Your Offer"
          subtitle="Generate niche-specific quiz questions and publish your sales page."
        />
        <WizardStepper currentStep={1} />
        <PageSkeleton cards={1} className="mt-4" />
      </div>
    );
  }

  const step = wizardUiStep;
  const copy = STEP_COPY[step];

  return (
    <div className="wizard-shell w-full">
      <PageHeader
        eyebrow="Sales Offer Generator"
        title={copy.title}
        subtitle={copy.subtitle}
      />

      <WizardStepper currentStep={step} />

      {step === 1 && (
        <ArmLinksPage embedded onContinue={() => goToStep(2, { linksArmed: true })} />
      )}
      {step === 2 && (
        <ChooseTerritoryPage
          embedded
          onBack={() => goToStep(1)}
          onContinue={() => goToStep(3, { territoryChosen: true })}
        />
      )}
      {step === 3 && (
        <ChooseThemePage
          embedded
          onBack={() => goToStep(2)}
          onContinue={() => goToStep(4, { themeChosen: true })}
        />
      )}
      {step === 4 && (
        <DeployAssetPage
          embedded
          onBack={() => goToStep(3)}
          onGenerateAnother={handleGenerateAnother}
        />
      )}
    </div>
  );
}
