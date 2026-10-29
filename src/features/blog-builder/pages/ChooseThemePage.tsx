"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { WizardStepBar } from "@/components/ui/wizard-step-bar";
import { PageLoading } from "@/components/ui/page-loading";
import { WizardStepper } from "../components/WizardStepper";
import { ThemePreview } from "../components/ThemePreview";
import { ThemeCustomizationCarousel } from "../components/ThemeCustomizationCarousel";
import { useBlogBuilder } from "../context/BlogBuilderContext";
import { NICHE_OPTIONS, type ThemeConfig } from "../types";
import {
  readyTemplateAccent,
  readyTemplateToConfig,
  findMatchingReadyTemplateId,
  getReadyTemplate,
  defaultThemeConfig,
  ACCENT_VARIANTS,
  sanitizeAccentColor,
  MAGENTA_ACCENT_COLORS,
} from "../themes";
import type { WizardStepProps } from "../lib/wizard-step-props";

export default function ChooseThemePage({ embedded, onContinue, onBack }: WizardStepProps = {}) {
  const router = useRouter();
  const {
    sessionLoaded,
    linksArmed,
    territoryChosen,
    niche,
    themeConfig,
    themeChosen,
    setThemeConfig,
    chooseTheme,
    deployArmedLinks,
  } = useBlogBuilder();

  const initialConfig = themeConfig ?? defaultThemeConfig();
  const [config, setConfig] = useState<ThemeConfig>(initialConfig);
  const [selectedTemplateId, setSelectedTemplateId] = useState(() =>
    findMatchingReadyTemplateId(initialConfig)
  );
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (themeChosen) setFinished(true);
  }, [themeChosen]);

  useEffect(() => {
    if (embedded) return;
    if (!sessionLoaded) return;
    if (!linksArmed) {
      router.replace("/arm-links");
    } else if (!territoryChosen) {
      router.replace("/territory");
    }
  }, [embedded, sessionLoaded, linksArmed, territoryChosen, router]);

  useEffect(() => {
    if (!themeConfig) return;
    const templateId = themeConfig.templateId ?? findMatchingReadyTemplateId(themeConfig);
    const template = getReadyTemplate(templateId);
    const fallback = readyTemplateAccent(template);
    const safeAccent = sanitizeAccentColor(themeConfig.accentOverride, fallback);
    const next =
      safeAccent === themeConfig.accentOverride
        ? themeConfig
        : { ...themeConfig, accentOverride: safeAccent };
    setConfig(next);
    setSelectedTemplateId(templateId);
    if (safeAccent !== themeConfig.accentOverride) {
      setThemeConfig(next);
    }
  }, [themeConfig, setThemeConfig]);

  const nicheLabel = NICHE_OPTIONS.find((n) => n.value === niche)?.label;
  const selectedTemplate = getReadyTemplate(selectedTemplateId);
  const templateDefaultAccent = readyTemplateAccent(selectedTemplate);
  const variants = ACCENT_VARIANTS[config.presetId] ?? ACCENT_VARIANTS.editorial;
  const accentOptions = (
    selectedTemplateId === "conversion-dark"
      ? variants
      : [...new Set([templateDefaultAccent, ...variants])]
  ).filter((color) => !MAGENTA_ACCENT_COLORS.has(color.trim().toLowerCase()));

  useEffect(() => {
    if (selectedTemplateId !== "conversion-dark") return;
    if (config.accentOverride !== "#10b981") return;
    const next = { ...config, accentOverride: "#059669", templateId: selectedTemplateId };
    setConfig(next);
    setThemeConfig(next);
  }, [selectedTemplateId, config, setThemeConfig]);

  const updateConfig = (patch: Partial<ThemeConfig>) => {
    const template = getReadyTemplate(selectedTemplateId);
    const fallback = readyTemplateAccent(template);
    const safePatch = patch.accentOverride
      ? { ...patch, accentOverride: sanitizeAccentColor(patch.accentOverride, fallback) }
      : patch;
    const next = { ...config, ...safePatch, templateId: selectedTemplateId };
    setConfig(next);
    setThemeConfig(next);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = getReadyTemplate(templateId);
    const next = readyTemplateToConfig(template);
    setSelectedTemplateId(templateId);
    setConfig(next);
    setThemeConfig(next);
  };

  const handleFinish = () => {
    setLoading(true);
    chooseTheme(config);
    setLoading(false);
    if (embedded && onContinue) {
      onContinue();
      return;
    }
    setFinished(true);
  };

  if (!sessionLoaded) {
    return <PageLoading message="Loading your session..." />;
  }

  if (finished && !embedded) {
    const link = deployArmedLinks[0];

    return (
      <div className="wizard-shell w-full">
        <WizardStepBar breadcrumb="Site Builder / Wrap-up" step={3} />

        <section className="wizard-panel animate-fade-in-up space-y-4 py-6 text-center">
          <CheckCircle2 size={48} className="mx-auto text-brass-700" />
          <div>
            <h1 className="ds-h1 mb-2">Setup Complete</h1>
            <p className="ds-subtitle">
              Your questionnaire site is configured. Launch it in the next step to generate and publish.
            </p>
          </div>

          <div className="surface-inset space-y-2 p-4 text-left text-sm">
            {link && (
              <p className="text-text-secondary">
                <span className="font-medium text-text-muted">Link:</span> {link.label}
              </p>
            )}
            {nicheLabel && (
              <p className="text-text-secondary">
                <span className="font-medium text-text-muted">Niche:</span> {nicheLabel}
              </p>
            )}
            <p className="text-text-secondary">
              <span className="font-medium text-text-muted">Template:</span> {selectedTemplate.name}
            </p>
            <p className="text-text-secondary">
              <span className="font-medium text-text-muted">Style:</span> {selectedTemplate.toneLabel}
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => setFinished(false)} className="btn-subtle">
              Edit choices
            </button>
            <Link href="/sales-offer-generator?step=4" className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3">
              <Rocket size={18} />
              Launch Your Website
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-4" : "wizard-shell w-full"}>
      {!embedded && (
        <>
          <WizardStepBar breadcrumb="Site Builder / Template" step={3} />
          <PageHeader
            eyebrow="Step 3"
            title="Choose a Template"
            subtitle="Swipe through templates, colors, and fonts — the live preview above updates instantly."
          />
          <WizardStepper currentStep={3} />
        </>
      )}

      <div className="theme-editor-split grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
        <div className="min-w-0 space-y-2">
          <p className="px-1 text-xs text-text-secondary">
            Live preview — updates as you pick template, color, and font
          </p>
          <div
            className={clsx(
              "theme-preview-linked theme-preview-compact-wrap overflow-hidden rounded-xl",
              selectedTemplate.structureId === "conversion" && "theme-preview-linked-dark"
            )}
          >
            <ThemePreview
              config={config}
              templateId={selectedTemplateId}
              nicheLabel={nicheLabel}
              linkedSelection
              compact
            />
          </div>
        </div>

        <ThemeCustomizationCarousel
          compact
          selectedTemplateId={selectedTemplateId}
          onTemplateSelect={handleTemplateSelect}
          config={config}
          updateConfig={updateConfig}
          accentOptions={accentOptions}
        />
      </div>

      <div className="wizard-action-bar">
        <button
          type="button"
          onClick={() => (onBack ? onBack() : router.push("/territory"))}
          className="btn-subtle sm:min-w-[8rem]"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          type="button"
          onClick={handleFinish}
          disabled={loading}
          className="btn-primary flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm sm:text-base"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          Continue with {selectedTemplate.name}
        </button>
      </div>
    </div>
  );
}
