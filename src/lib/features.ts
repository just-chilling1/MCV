import type { LucideIcon } from "lucide-react";
import { isFeatureEnabled } from "@/config/features.config";
import {
  homeNav,
  workflowSteps,
  extractionWorkflowSteps,
  blogBuilderWorkflowSteps,
  blogBuilderGenerateNav,
  blogBuilderLibrariesNav,
  coreResourceNav,
  resourceNav,
  premiumNav,
  premiumSectionLabel,
  bottomNavTabs,
  bottomNavMoreLinks,
  vaultToolNav,
  sidebarSections,
  type NavItem,
  type SidebarSection,
} from "@/config/navigation.config";
import { getNavIcon } from "@/lib/nav-icons";

export interface PremiumFeature {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const PREMIUM_SECTION_LABEL = premiumSectionLabel;

/** One-line descriptions keyed by route — shown in the dashboard Premium Upgrades widget. */
const PREMIUM_DESCRIPTIONS: Record<string, string> = {
  "/dfy-profit": "Affiliate link + niche → Craft article, authority article, and 3 Facebook posts.",
  "/autopilot": "Share Craft articles and Links Library URLs across curated traffic sources.",
  "/recurring-wealth": "100 ready-to-publish authority articles with your link.",
  "/social-payouts": "Bulk social posts from any offer — copy and paste.",
  "/protector": "Account security score and verification trust layer.",
  "/license-rights": "Request reseller license rights — our team activates the edition.",
  "/infinite": "Unlimited — a full library of ready-to-save articles across ten niches.",
};

function filterNav(items: NavItem[]): NavItem[] {
  return items.filter((item) => !item.feature || isFeatureEnabled(item.feature));
}

export function getVisibleWorkflowSteps(): NavItem[] {
  if (isFeatureEnabled("extraction-workflow")) {
    return filterNav(extractionWorkflowSteps);
  }
  if (isFeatureEnabled("core-workflow")) {
    return filterNav(workflowSteps);
  }
  return [];
}

export function getBlogBuilderWorkflowSteps(): NavItem[] {
  return filterNav(blogBuilderWorkflowSteps);
}

export function getBlogBuilderGenerateNav(): NavItem[] {
  return filterNav(blogBuilderGenerateNav);
}

export function getBlogBuilderLibrariesNav(): NavItem[] {
  return filterNav(blogBuilderLibrariesNav);
}

export function getVaultToolNav(): NavItem[] {
  return filterNav(vaultToolNav);
}

export function getSidebarSections(): SidebarSection[] {
  return sidebarSections
    .map((section) => ({ ...section, items: filterNav(section.items) }))
    .filter((section) => section.items.length > 0);
}

export function getCoreResourceNav(): NavItem[] {
  return filterNav(coreResourceNav);
}

export function getVisibleResourceNav(): NavItem[] {
  return filterNav(resourceNav);
}

export function getVisiblePremiumNav(): NavItem[] {
  return filterNav(premiumNav);
}

/** Fresh list each call — avoids stale SSR/client nav module drift. */
export function getPremiumFeatures(): PremiumFeature[] {
  return getVisiblePremiumNav().map((item) => ({
    href: item.path,
    label: item.label,
    description: PREMIUM_DESCRIPTIONS[item.path] ?? "Unlock more with your membership.",
    icon: getNavIcon(item.icon),
  }));
}

export function getBottomNavTabs(): NavItem[] {
  const tabs = filterNav(bottomNavTabs);
  if (tabs.length >= 2) return tabs.slice(0, 4);
  return [homeNav, ...filterNav(coreResourceNav)].slice(0, 4);
}

export function getBottomNavMoreLinks(): NavItem[] {
  const tabPaths = new Set(getBottomNavTabs().map((t) => t.path));
  const premiumPaths = new Set(getVisiblePremiumNav().map((t) => t.path));

  const candidates: NavItem[] = [
    ...vaultToolNav,
    ...workflowSteps,
    ...blogBuilderGenerateNav,
    ...blogBuilderLibrariesNav,
    ...coreResourceNav,
    ...resourceNav,
    ...bottomNavMoreLinks,
  ];

  const seen = new Set<string>();
  return filterNav(candidates).filter((item) => {
    if (tabPaths.has(item.path) || premiumPaths.has(item.path)) return false;
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
}

export function isNavItemLocked(
  item: NavItem,
  workflowProgress: number
): boolean {
  if (!item.requiresWorkflowStep) return false;
  return workflowProgress < item.requiresWorkflowStep;
}

export function getWorkflowProgress(
  pathname: string,
  hasVariations: boolean,
  hasAnalysis: boolean,
  hasSelectedAds: boolean
): number {
  if (pathname === "/replies" && hasSelectedAds) return 4;
  if (pathname === "/radar" || hasSelectedAds) return 3;
  if (pathname === "/analysis" || hasAnalysis) return 2;
  if (pathname === "/search" || hasVariations) return 1;
  return 0;
}
