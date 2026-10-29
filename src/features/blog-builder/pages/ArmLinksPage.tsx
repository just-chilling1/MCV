"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import {
  Loader2,
  ArrowRight,
  Save,
  Check,
  CheckCircle2,
  Zap,
  Tag,
  ChevronDown,
  ExternalLink,
  UserPlus,
  Search,
  MousePointerClick,
  Copy,
  ClipboardPaste,
  FolderOpen,
  PenLine,
} from "lucide-react";
import { GlassInput } from "@/components/ui/glass-input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { ErrorBanner } from "@/components/ui/error-banner";
import { WizardStepBar } from "@/components/ui/wizard-step-bar";
import { ContentReservePicker } from "../components/ContentReservePicker";
import { WizardStepper } from "../components/WizardStepper";
import { useBlogBuilder } from "../context/BlogBuilderContext";
import type { ArmedLink } from "../types";
import type { WizardStepProps } from "../lib/wizard-step-props";
import { detectLinkNetwork, isValidAffiliateUrl, normalizeAffiliateUrl } from "../lib/affiliate-url";

function warmScrapeCache(url: string) {
  void fetch("/api/blog/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  }).catch(() => {});
}

const INSTRUCTION_STEPS = [
  {
    number: 1,
    text: "Go to Digistore24.com and create a free account",
    icon: UserPlus,
    link: "https://www.digistore24.com",
    linkLabel: "Open Digistore24",
  },
  {
    number: 2,
    text: "Navigate to the Marketplace and find your product",
    icon: Search,
  },
  {
    number: 3,
    text: 'Click "Promote Now" to get your unique affiliate link',
    icon: MousePointerClick,
  },
  {
    number: 4,
    text: "Copy your affiliate link",
    icon: Copy,
  },
  {
    number: 5,
    text: 'Paste it below and click "Save to Links Library"',
    icon: ClipboardPaste,
  },
];

type LinkMode = "library" | "manual";

export default function ArmLinksPage({ embedded, onContinue }: WizardStepProps = {}) {
  const router = useRouter();
  const { sessionLoaded, armedLinks, saveLinksToVault, armLinks } = useBlogBuilder();

  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedVaultUrl, setSelectedVaultUrl] = useState<string | null>(null);
  const [linkSaved, setLinkSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  // null until the user picks a tab; default depends on whether the library has links.
  const [modeOverride, setModeOverride] = useState<LinkMode | null>(null);

  const hasVaultLinks = armedLinks.length > 0;
  const mode: LinkMode = modeOverride ?? (hasVaultLinks ? "library" : "manual");

  const handleSelectFromVault = (link: ArmedLink | null) => {
    if (!link) {
      setSelectedVaultUrl(null);
      setLinkUrl("");
      setLinkLabel("");
      setLinkSaved(false);
      setError(null);
      return;
    }

    setSelectedVaultUrl(link.url);
    setLinkUrl(link.url);
    setLinkLabel(link.label);
    setLinkSaved(true);
    setError(null);
    warmScrapeCache(link.url);
  };

  const clearVaultSelectionIfEdited = (nextUrl: string, nextLabel: string) => {
    if (!selectedVaultUrl) return;
    const vaultLink = armedLinks.find((l) => l.url === selectedVaultUrl);
    if (!vaultLink) {
      setSelectedVaultUrl(null);
      return;
    }
    if (
      normalizeAffiliateUrl(nextUrl) !== normalizeAffiliateUrl(vaultLink.url) ||
      nextLabel !== vaultLink.label
    ) {
      setSelectedVaultUrl(null);
    }
  };

  const handleSaveToVault = async () => {
    const url = normalizeAffiliateUrl(linkUrl);
    if (!isValidAffiliateUrl(url)) {
      setError("Please enter a valid URL starting with https://");
      return;
    }

    setError(null);
    setLoading(true);

    const newLink: ArmedLink = {
      label: linkLabel.trim() || "Promotional Offer",
      url,
      network: detectLinkNetwork(url),
    };

    const existing = armedLinks.filter((l) => l.url !== url);
    const nextLinks = [newLink, ...existing];

    try {
      await saveLinksToVault(nextLinks);
      setLinkSaved(true);
      setSelectedVaultUrl(url);
      warmScrapeCache(url);
    } catch {
      setError("Could not save to Links Library. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    const url = normalizeAffiliateUrl(linkUrl);
    if (!isValidAffiliateUrl(url)) {
      setError(
        mode === "library"
          ? "Select a saved link above, or switch to Enter Manually to paste a new one."
          : "Please enter a valid affiliate link (https://...) before continuing."
      );
      return;
    }

    setError(null);
    setLoading(true);

    const link: ArmedLink = {
      label: linkLabel.trim() || "Promotional Offer",
      url,
      network: detectLinkNetwork(url),
    };

    try {
      armLinks([link]);
      warmScrapeCache(url);
      if (onContinue) {
        onContinue();
        setLoading(false);
      } else {
        router.push("/territory");
      }
    } catch {
      setError("Could not continue. Try again.");
      setLoading(false);
    }
  };

  const switchMode = (next: LinkMode) => {
    setModeOverride(next);
    setError(null);
  };

  if (!sessionLoaded) {
    return <PageLoading message="Loading your session..." />;
  }

  return (
    <div className={embedded ? "space-y-4" : "wizard-shell w-full"}>
      {!embedded && (
        <>
          <WizardStepBar breadcrumb="Site Builder / Link" step={1} />
          <PageHeader
            eyebrow="Step 1"
            title="Add Your Link"
            subtitle="Choose a saved link from your Links Library, or paste a new promotional or affiliate link. It will be placed on your generated website."
          />
          <WizardStepper currentStep={1} />
        </>
      )}

      <section className="wizard-panel overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setInstructionsOpen(!instructionsOpen)}
          aria-expanded={instructionsOpen}
          className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-page/80 sm:px-5"
        >
          <div className="flex items-center gap-3">
            <div className="wizard-panel-icon">
              <ClipboardPaste className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider text-text-heading">
              How to Get Your Affiliate Link
            </span>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-text-muted transition-transform duration-200 ${instructionsOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: instructionsOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 px-4 pb-4 sm:px-5 sm:pb-5">
              {INSTRUCTION_STEPS.map((step) => (
                <div key={step.number} className="wizard-inset-row">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--mcv-line-brass)] bg-brass-100">
                    <span className="text-[13px] font-medium text-brass-700">{step.number}</span>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <step.icon className="h-3.5 w-3.5 shrink-0 text-brass-700" />
                      <span className="text-sm text-text-primary">{step.text}</span>
                    </div>
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-brass-700 hover:text-brass-900 transition-colors"
                      >
                        {step.linkLabel}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="wizard-panel animate-fade-in-up overflow-hidden p-0">
        {hasVaultLinks && (
          <div
            className="flex gap-1 border-b border-border-dim/70 px-3 pt-2"
            role="tablist"
            aria-label="Link source"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "library"}
              onClick={() => switchMode("library")}
              className={clsx("tab-pill -mb-px", mode === "library" && "is-active")}
            >
              <FolderOpen size={15} />
              Saved Links ({armedLinks.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "manual"}
              onClick={() => switchMode("manual")}
              className={clsx("tab-pill -mb-px", mode === "manual" && "is-active")}
            >
              <PenLine size={15} />
              Enter Manually
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 p-4 sm:p-6">
          {mode === "library" && hasVaultLinks ? (
            <ContentReservePicker
              links={armedLinks}
              selectedUrl={selectedVaultUrl}
              onSelect={handleSelectFromVault}
              showDivider={false}
            />
          ) : (
            <>
              <div className="space-y-2">
                <label className="wizard-form-label">Link Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brass-700">
                    <Tag className="h-5 w-5" />
                  </div>
                  <GlassInput
                    type="text"
                    value={linkLabel}
                    onChange={(e) => {
                      const nextLabel = e.target.value;
                      setLinkLabel(nextLabel);
                      setLinkSaved(false);
                      clearVaultSelectionIfEdited(linkUrl, nextLabel);
                    }}
                    placeholder="e.g. My Fitness eBook, Keto Supplement, etc."
                    className="h-12 pl-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="wizard-form-label">Paste Your Affiliate Link</label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brass-700">
                    <Zap className="h-5 w-5" />
                  </div>
                  <GlassInput
                    type="url"
                    value={linkUrl}
                    onChange={(e) => {
                      const nextUrl = e.target.value;
                      setLinkUrl(nextUrl);
                      setLinkSaved(false);
                      clearVaultSelectionIfEdited(nextUrl, linkLabel);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && linkUrl.trim()) void handleSaveToVault();
                    }}
                    placeholder="Paste Digistore24 affiliate URL here..."
                    className="h-12 pl-12 text-base"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveToVault()}
                  disabled={!linkUrl.trim() || loading}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : linkSaved ? (
                    <Check size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {linkSaved ? "Saved to Links Library" : "Save to Links Library"}
                </button>
                {linkSaved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                    <CheckCircle2 size={15} />
                    Available for reuse anytime
                  </span>
                )}
              </div>
            </>
          )}

          {error && <ErrorBanner message={error} />}

          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={loading || !linkUrl.trim()}
            className="btn-primary w-full disabled:opacity-40"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
            Continue to Niche
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
