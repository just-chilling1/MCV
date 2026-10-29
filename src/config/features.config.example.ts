import type { FeatureId } from "./features.config";

/**
 * Example presets — copy into enabledFeatures in features.config.ts.
 * Pick the stack that matches the product you are building.
 */

/** Affiliate reply workflow product (CashTap AI style) */
export const affiliateWorkflowFeatures: FeatureId[] = [
  "training",
  "core-workflow",
  "dopamine",
  "scale-upsell",
  "premium-dfy",
  "premium-instant",
  "premium-autopilot",
];

/** Secret Millionaire Society — blog builder + premium stack */
export const blogBuilderFeatures: FeatureId[] = [
  "training",
  "blog-builder",
  "dopamine",
  "premium-accelerator",
  "premium-recurring",
  "premium-social",
  "protector",
];

/** Extraction / connect dashboard product */
export const extractionWorkflowFeatures: FeatureId[] = [
  "training",
  "extraction-workflow",
  "dopamine",
  "premium-dfy",
  "premium-instant",
  "premium-autopilot",
  "protector",
];

/** Digital product launcher (Click Clone Profits style) */
export const digitalProductFeatures: FeatureId[] = [
  "training",
  "product-wizard",
  "niche-finder",
  "dopamine",
  "premium-dfy",
  "premium-instant",
  "premium-autopilot",
  "protector",
];

/** SEO article / content site product (Battery Profits style) */
export const contentSiteFeatures: FeatureId[] = [
  "training",
  "article-wizard",
  "article-images",
  "article-publish",
  "portfolio",
  "dopamine",
  "premium-10x",
  "premium-infinite",
  "premium-automation",
  "premium-dfy",
];

/** Image + link affiliate product (Q-Labs style) */
export const imageLinkFeatures: FeatureId[] = [
  "training",
  "image-forge",
  "money-links-vault",
  "launchpad",
  "premium-dfy",
  "premium-instant",
  "premium-autopilot",
];

/** Bridge page + traffic product (AI Wealth style) */
export const bridgeTrafficFeatures: FeatureId[] = [
  "training",
  "wealth-sync",
  "traffic-hub",
  "income-calculator",
  "dopamine",
  "premium-dfy",
  "premium-recurring",
  "premium-instant",
  "protector",
];

/** Gold Rush / comment pack product */
export const commentPackFeatures: FeatureId[] = [
  "training",
  "comment-pack",
  "dopamine",
  "premium-dfy",
  "premium-instant",
  "premium-autopilot",
  "protector",
];

/** Enable every catalog module (dev / reference only) */
export const allFeaturesExample: FeatureId[] = [
  "training",
  "dopamine",
  "scale-upsell",
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
  "premium-dfy",
  "premium-instant",
  "premium-autopilot",
  "premium-social",
  "premium-10x",
  "premium-infinite",
  "premium-automation",
  "premium-recurring",
  "protector",
];
