"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { DeploySiteLoader } from "../components/DeploySiteLoader";
import { PageHeader } from "@/components/ui/page-header";
import { WizardStepBar } from "@/components/ui/wizard-step-bar";
import { PageLoading } from "@/components/ui/page-loading";
import { useBlogBuilder } from "../context/BlogBuilderContext";
import { DeployCompletePanel } from "../components/DeployCompletePanel";
import { DeployLaunchPanel } from "../components/DeployLaunchPanel";
import { DeploySitePreview } from "../components/DeploySitePreview";
import { WizardStepper } from "../components/WizardStepper";
import { useGenerationCompleteScroll } from "@/components/ui/generation-progress";
import {
  GenerationTrainingAd,
  useGenerationTrainingAd,
} from "@/components/ui/generation-training-ad";
import { getReadyTemplateFromConfig } from "../themes";
import { getSiteTerritory } from "../lib/site-territory";
import type { ArmedLink, BlogSite } from "../types";
import { NICHE_OPTIONS } from "../types";
import type { WizardStepProps } from "../lib/wizard-step-props";
import { SALES_OFFER_GENERATOR_PATH } from "../lib/wizard-step-props";

interface GenerationQuota {
  limit: number | null;
  usedToday: number;
  remaining: number | null;
  unlimited?: boolean;
}

type DeployPhase = "idle" | "setup" | "generating" | "publishing" | "complete" | "error";

async function postJson(
  url: string,
  body: unknown
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> | null }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

function busyError(status: number): string {
  if (status === 502 || status === 503 || status === 504 || status === 408 || status === 0) {
    return "The server got busy and timed out. Click Try Deploy Again to continue.";
  }
  return "The server returned an unexpected response. Click Try Deploy Again.";
}

function linkFingerprint(links: ArmedLink[]): string {
  return links
    .map((l) => l.url.trim())
    .filter(Boolean)
    .sort()
    .join("|");
}

function siteMatchesWizard(
  site: BlogSite,
  hobby: string,
  territory: string,
  armedLinks: ArmedLink[]
): boolean {
  const niche = (territory.trim() || hobby.trim()).toLowerCase();
  const siteNiche = getSiteTerritory(site).trim().toLowerCase();
  const siteLinks = linkFingerprint((site.armed_links ?? []) as ArmedLink[]);
  const currentLinks = linkFingerprint(armedLinks);
  return Boolean(niche) && siteNiche === niche && siteLinks === currentLinks;
}

export default function DeployAssetPage({
  embedded,
  onBack,
  onGenerateAnother,
}: WizardStepProps & { onGenerateAnother?: () => void } = {}) {
  const router = useRouter();
  const {
    sessionLoaded,
    linksArmed,
    themeChosen,
    hobby,
    territory,
    niche,
    themeConfig,
    deployArmedLinks,
    deployed,
    setGenerating,
    markDeployed,
    appendLog,
    beginNewSiteGeneration,
  } = useBlogBuilder();

  const [phase, setPhase] = useState<DeployPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [site, setSite] = useState<BlogSite | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [deployLoaded, setDeployLoaded] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [resumeLabel, setResumeLabel] = useState("");
  const [quota, setQuota] = useState<GenerationQuota | null>(null);
  const deployRunning = useRef(false);

  const isLoading = phase === "setup" || phase === "generating" || phase === "publishing";
  const isComplete = phase === "complete" && Boolean(site);
  const trainingAd = useGenerationTrainingAd(isLoading, { showWhenComplete: isComplete });

  useGenerationCompleteScroll(isLoading, undefined, isComplete || isLoading);

  useEffect(() => {
    if (embedded) return;
    if (!sessionLoaded) return;
    if (!linksArmed) router.replace("/sales-offer-generator");
    else if (!territory.trim() && !niche.trim()) router.replace("/territory");
    else if (!themeChosen) router.replace("/theme");
  }, [embedded, linksArmed, themeChosen, territory, niche, sessionLoaded, router]);

  useEffect(() => {
    if (!sessionLoaded) return;

    let cancelled = false;

    async function loadDeployState() {
      try {
        const res = await fetch("/api/blog/deploy-state", { cache: "no-store" });
        const data = res.ok ? await res.json() : null;
        if (cancelled || !data) return;

        if (data.quota) setQuota(data.quota as GenerationQuota);

        if (embedded) return;

        const loadedSite = data.site as BlogSite | null;
        const matchesCurrent =
          loadedSite && siteMatchesWizard(loadedSite, hobby, territory, deployArmedLinks);
        const isSessionSite =
          !data.session?.site_id || !loadedSite || data.session.site_id === loadedSite.id;

        if (loadedSite && matchesCurrent && isSessionSite) {
          setSite(loadedSite);

          if (data.session?.deployed || deployed) {
            setPhase("complete");
          } else if (data.canResume) {
            setCanResume(true);
            if (data.isProductSite && !loadedSite.sales_page_html) {
              setResumeLabel("Continue — finish building your questionnaire");
            } else if (data.isProductSite && loadedSite.sales_page_html) {
              setResumeLabel("Publish your questionnaire site");
            } else {
              setResumeLabel("Continue deployment");
            }
          }
        }
      } finally {
        if (!cancelled) setDeployLoaded(true);
      }
    }

    loadDeployState();
    return () => {
      cancelled = true;
    };
  }, [sessionLoaded, deployed, hobby, territory, deployArmedLinks]);

  const prepareFreshDeploy = () => {
    beginNewSiteGeneration();
    setPhase("idle");
    setSite(null);
    setProductName(null);
    setCanResume(false);
    setError(null);
    trainingAd.resetBanner();
  };

  const publishSite = async (siteId: string, siteSlug: string) => {
    setPhase("publishing");
    appendLog("Publishing your questionnaire site...");

    const { ok: pubOk, status: pubStatus, data: pubData } = await postJson("/api/blog/publish", {
      siteId,
    });
    if (!pubOk) throw new Error((pubData?.error as string) || busyError(pubStatus));

    const publishedSite = pubData?.site as BlogSite | undefined;
    if (publishedSite) {
      setSite(publishedSite);
    } else {
      setSite((prev) => (prev ? { ...prev, status: "live" } : prev));
    }

    appendLog("Your niche questionnaire is live.");
    markDeployed(siteId, siteSlug);
    setPhase("complete");
    setCanResume(false);
    setGenerating(false);
  };

  const deploy = async (resume = false) => {
    if (deployRunning.current) return;
    deployRunning.current = true;

    setError(null);
    setCanResume(false);
    setGenerating(true);

    const deployNicheLabel =
      NICHE_OPTIONS.find((n) => n.value === niche)?.label ??
      (territory.trim() || hobby.trim() || niche.trim());

    if (!deployNicheLabel) {
      setError("Missing niche — go back to Step 2 and pick a niche first.");
      setPhase("error");
      setGenerating(false);
      deployRunning.current = false;
      return;
    }

    if (deployArmedLinks.length === 0 && !resume) {
      setError("No product links found — go back to Step 1 and add at least one affiliate link.");
      setPhase("error");
      setGenerating(false);
      deployRunning.current = false;
      return;
    }

    let resumeSiteId: string | null = site?.id ?? null;

    try {
      let activeSite = site;
      let productContext = "";
      let scrapedTitle: string | undefined;
      let scrapedDescription: string | undefined;

      const affiliateUrl = deployArmedLinks[0]?.url;

      if (resume && activeSite?.sales_page_html) {
        setPhase("generating");
        await publishSite(activeSite.id, activeSite.slug);
        deployRunning.current = false;
        return;
      }

      async function scrapeAffiliateOffer() {
        if (!affiliateUrl) return;
        try {
          const scrapeRes = await fetch("/api/blog/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: affiliateUrl }),
          });
          const scrapeData = await scrapeRes.json();
          if (scrapeRes.ok) {
            productContext = scrapeData.context || "";
            scrapedTitle = scrapeData.data?.title;
            scrapedDescription = scrapeData.data?.description;
            appendLog(scrapeData.cached ? "Offer page loaded from cache." : "Offer page scanned.");
          }
        } catch {
          appendLog("Could not scan offer page — using niche defaults.");
        }
      }

      if (!resume || !activeSite) {
        setPhase("setup");
        setSite(null);
        setProductName(null);
        beginNewSiteGeneration();

        appendLog("Creating your questionnaire site and scanning the offer page...");

        const scrapeTask = scrapeAffiliateOffer();
        const createTask = postJson("/api/blog/create-site", {
          hobby: deployNicheLabel,
          territory: deployNicheLabel,
          armedLinks: deployArmedLinks,
          themeConfig,
        });

        const [, createResult] = await Promise.all([scrapeTask, createTask]);
        const { ok: createOk, status: createStatus, data: createData } = createResult;

        if (!createOk || !createData) {
          throw new Error((createData?.error as string) || busyError(createStatus));
        }
        if (createData.quota) setQuota(createData.quota as GenerationQuota);

        activeSite = createData.site as BlogSite;
        setSite(activeSite);
        resumeSiteId = activeSite.id;
      } else if (affiliateUrl && !productContext) {
        appendLog("Scanning affiliate offer page...");
        await scrapeAffiliateOffer();
      }

      if (!activeSite) throw new Error("Site record missing");

      if (!activeSite.sales_page_html) {
        setPhase("generating");
        appendLog("Writing quiz questions and building your themed questionnaire...");

        const { ok: genOk, status: genStatus, data: genData } = await postJson(
          "/api/blog/generate-product-site",
          {
            siteId: activeSite.id,
            niche: deployNicheLabel,
            armedLinks: deployArmedLinks,
            themeConfig,
            productContext,
            scrapedTitle,
            scrapedDescription,
          }
        );

        if (!genOk || !genData) {
          throw new Error((genData?.error as string) || busyError(genStatus));
        }

        activeSite = genData.site as BlogSite;
        setSite(activeSite);
        setProductName((genData.productName as string) || activeSite.title);
        appendLog(`Questionnaire ready: ${genData.productName || activeSite.title}`);
      }

      await publishSite(activeSite.id, activeSite.slug);
    } catch (e) {
      let msg = e instanceof Error ? e.message : "Deploy failed";
      if (msg === "Unauthorized") {
        msg = "Not signed in. Please log in at /login and try again.";
      }
      appendLog(`Error: ${msg}`);

      if (resumeSiteId) {
        setCanResume(true);
        setResumeLabel("Continue — finish building your questionnaire");
      }

      setError(msg);
      setPhase("error");
      setGenerating(false);
    } finally {
      deployRunning.current = false;
    }
  };

  if (!sessionLoaded || !deployLoaded) {
    return <PageLoading message="Loading your deploy session..." />;
  }

  const showErrorPreview = Boolean(site) && phase === "error";

  const nicheLabel =
    NICHE_OPTIONS.find((n) => n.value === niche)?.label ??
    (territory.trim() || hobby.trim() || "Your niche");
  const templateName = themeConfig
    ? getReadyTemplateFromConfig(themeConfig).name
    : "Selected template";

  return (
    <div className={embedded ? "space-y-4" : "wizard-shell w-full"}>
      {!embedded && (
        <>
          <WizardStepBar breadcrumb="Site Builder / Launch" step={4} />
          <PageHeader
            eyebrow="Step 4"
            title={isComplete ? "Your Questionnaire Is Live" : "Launch Your Questionnaire Site"}
            subtitle={
              isComplete
                ? "Your niche quiz is published and ready to share. Visitors answer questions, then see your affiliate offer on the last page."
                : "We generate niche-specific quiz questions and place your affiliate link on the final results page — then publish instantly."
            }
          />
          {!isComplete && <WizardStepper currentStep={4} />}
        </>
      )}

      {embedded && !isComplete && onBack && (
        <div className="mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--mcv-line)] bg-white px-3 py-2 text-[13px] font-medium text-ink-3 transition-colors hover:border-[var(--mcv-line-strong)] hover:bg-[var(--mcv-surface-field)] hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Template
          </button>
        </div>
      )}

      {isLoading && (
        <DeploySiteLoader
          phase={phase === "setup" || phase === "generating" || phase === "publishing" ? phase : "generating"}
        />
      )}

      <GenerationTrainingAd
        show={trainingAd.showBanner}
        bannerKey={trainingAd.bannerKey}
        onDismiss={trainingAd.dismissBanner}
      />

      {!isLoading && !isComplete && (phase === "idle" || phase === "error") && (
        <DeployLaunchPanel
          nicheLabel={nicheLabel}
          templateName={templateName}
          linkCount={deployArmedLinks.length}
          quotaRemaining={quota?.remaining}
          quotaLimit={quota?.limit}
          quotaUnlimited={quota?.unlimited}
          canResume={canResume}
          resumeLabel={resumeLabel}
          error={error}
          phase={phase}
          onLaunch={() => deploy(false)}
          onResume={() => deploy(true)}
          onRetry={() => deploy(canResume)}
        />
      )}

      {showErrorPreview && site && (
        <DeploySitePreview site={site} />
      )}

      {isComplete && site && (
        <DeployCompletePanel
          site={site}
          productName={productName}
          onGenerateAnother={() => {
            prepareFreshDeploy();
            if (onGenerateAnother) {
              onGenerateAnother();
            } else {
              router.push(`${SALES_OFFER_GENERATOR_PATH}?step=1`);
            }
          }}
          onViewVault={() => router.push("/offers")}
        />
      )}
    </div>
  );
}
