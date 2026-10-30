export const FEATURE_IDS = [
  // CORE — resources & engagement
  "training",
  "dopamine",
  "scale-upsell",
  // CORE — workflow modules (enable per product)
  "core-workflow",
  "extraction-workflow",
  "blog-builder",
  "image-forge",
  "money-links-vault",
  "launchpad",
  "article-wizard",
  "article-images",
  "article-publish",
  "portfolio",
  "b2b-outreach",
  "wealth-sync",
  "traffic-hub",
  "income-calculator",
  "product-wizard",
  "niche-finder",
  "comment-pack",
  // PREMIUM — upsell modules
  "premium-dfy",
  "premium-dfy-profit",
  "premium-instant",
  "premium-autopilot",
  "premium-accelerator",
  "premium-social",
  "premium-10x",
  "premium-infinite",
  "premium-automation",
  "premium-recurring",
  "protector",
  "premium-license-rights",
] as const;

export type FeatureId = (typeof FEATURE_IDS)[number];

export type FeatureTier = "core" | "premium";

export interface FeatureMeta {
  id: FeatureId;
  tier: FeatureTier;
  description: string;
  guide: string;
}

/** Catalog metadata — see .cursor/skills/product-feature-catalog/ */
export const FEATURE_CATALOG: FeatureMeta[] = [
  { id: "training", tier: "core", description: "Training page with videos, FAQ, workflow guide, and launch checklist.", guide: "training-support" },
  { id: "dopamine", tier: "core", description: "Engagement widgets: social proof toasts, earnings counters, popups, trust bar.", guide: "dopamine-engagement" },
  { id: "scale-upsell", tier: "core", description: "External scale-training sales page with video and checkout link.", guide: "scale-training-upsell" },
  { id: "core-workflow", tier: "core", description: "Four-step affiliate workflow: search → analysis → radar → AI replies.", guide: "core-workflow" },
  { id: "extraction-workflow", tier: "core", description: "Connect → scan → extract dashboard with live connection status.", guide: "extraction-workflow" },
  { id: "blog-builder", tier: "core", description: "AI money-site builder: territory → links → deploy → hosted sites.", guide: "blog-builder" },
  { id: "image-forge", tier: "core", description: "AI image generator for prompts and marketing visuals.", guide: "image-forge" },
  { id: "money-links-vault", tier: "core", description: "Save and manage affiliate links with labels and niches.", guide: "money-links-vault" },
  { id: "launchpad", tier: "core", description: "Step-by-step launch checklist to publish and monetize.", guide: "launchpad" },
  { id: "article-wizard", tier: "core", description: "AI article creation: niche → headlines → full SEO article.", guide: "article-wizard" },
  { id: "article-images", tier: "core", description: "Generate hero and social images for article drafts.", guide: "article-images" },
  { id: "article-publish", tier: "core", description: "Preview, SEO meta, and publish or export article HTML.", guide: "article-publish" },
  { id: "portfolio", tier: "core", description: "Library of saved drafts and published articles.", guide: "portfolio" },
  { id: "b2b-outreach", tier: "core", description: "B2B stack: offers library → lead finder → AI email builder.", guide: "b2b-outreach" },
  { id: "wealth-sync", tier: "core", description: "Paste affiliate URL → AI builds a hosted bridge/review page.", guide: "wealth-sync" },
  { id: "traffic-hub", tier: "core", description: "Outreach targets and AI comments to drive visitors to bridge pages.", guide: "traffic-hub" },
  { id: "income-calculator", tier: "core", description: "Interactive income projection from traffic and commission inputs.", guide: "income-calculator" },
  { id: "product-wizard", tier: "core", description: "Multi-step digital product wizard: niche → ebook → sales page → publish.", guide: "product-wizard" },
  { id: "niche-finder", tier: "core", description: "Discover sub-niches and jump into product creation.", guide: "niche-finder" },
  { id: "comment-pack", tier: "core", description: "Gold Rush workflow: find videos → generate viral comment packs → share vault.", guide: "comment-pack" },
  { id: "premium-dfy", tier: "premium", description: "Done-for-you vault: pre-made keywords, articles, images, leads, or products.", guide: "premium-dfy" },
  { id: "premium-dfy-profit", tier: "premium", description: "One-click kit: affiliate link + niche → Craft article, authority article, header/mid/conclusion images, and 3 Facebook posts.", guide: "premium-dfy-profit" },
  { id: "premium-instant", tier: "premium", description: "Pre-written social posts with images — copy and paste to Facebook.", guide: "premium-instant" },
  { id: "premium-autopilot", tier: "premium", description: "Share Craft articles and Links Library URLs across curated traffic sources.", guide: "premium-autopilot" },
  { id: "premium-accelerator", tier: "premium", description: "200 pre-made sales pages + X threads across all niches (seed once, clone on demand).", guide: "premium-accelerator" },
  { id: "premium-social", tier: "premium", description: "Bulk social post generator — many Facebook variants from one offer.", guide: "premium-social" },
  { id: "premium-10x", tier: "premium", description: "Alias for Instant Income bulk post generation (see premium-social).", guide: "premium-10x" },
  { id: "premium-infinite", tier: "premium", description: "Batch-generate multiple full articles from one niche.", guide: "premium-infinite" },
  { id: "premium-automation", tier: "premium", description: "Schedule articles and posts on a publishing calendar.", guide: "premium-automation" },
  { id: "premium-recurring", tier: "premium", description: "100 ready-to-publish authority articles (Guaranteed High-Ticket Payouts).", guide: "premium-recurring" },
  { id: "protector", tier: "premium", description: "Account security score and verification trust UI.", guide: "protector" },
  { id: "premium-license-rights", tier: "premium", description: "Reseller license request form — send a License Rights ticket and wait for team activation.", guide: "premium-license-rights" },
];

/** Mobile Cash Vault — core writing tools plus every premium module. */
export const enabledFeatures: FeatureId[] = [
  "training",
  "dopamine",
  "article-wizard",
  "article-images",
  "article-publish",
  "portfolio",
  "money-links-vault",
  // Kept on so recurring / done-for-you profit can create hosted sites.
  // Not shown in the sidebar (see vaultToolNav).
  "blog-builder",
  "premium-dfy-profit",
  "premium-autopilot",
  "premium-social",
  "premium-infinite",
  "premium-recurring",
  "protector",
  "premium-license-rights",
];

export function isFeatureEnabled(id: FeatureId): boolean {
  if (enabledFeatures.includes(id)) return true;
  // premium-10x is a documented alias of premium-social
  if (id === "premium-10x") return enabledFeatures.includes("premium-social");
  if (id === "premium-social") return enabledFeatures.includes("premium-10x");
  return false;
}

export function getFeatureMeta(id: FeatureId): FeatureMeta | undefined {
  return FEATURE_CATALOG.find((f) => f.id === id);
}
