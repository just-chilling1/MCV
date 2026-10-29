import type { FeatureId } from "./features.config";

export type NavIconName =
  | "LayoutGrid"
  | "Search"
  | "Brain"
  | "Radar"
  | "MessageSquare"
  | "GraduationCap"
  | "TrendingUp"
  | "Scan"
  | "Sparkles"
  | "Rocket"
  | "Headphones"
  | "Wifi"
  | "Activity"
  | "Wallet"
  | "Globe"
  | "Link2"
  | "FileText"
  | "MapPin"
  | "ShieldCheck"
  | "Repeat"
  | "Megaphone"
  | "Image"
  | "PenLine"
  | "FolderOpen"
  | "Send"
  | "Calculator"
  | "Users"
  | "Zap";

export interface NavItem {
  path: string;
  label: string;
  icon: NavIconName;
  feature?: FeatureId;
  /** Workflow step index for progress bar; omit for non-workflow items */
  workflowStep?: number;
  /** Requires prior workflow steps to be complete */
  requiresWorkflowStep?: number;
}

export const homeNav: NavItem = {
  path: "/dashboard",
  label: "Vault HQ",
  icon: "LayoutGrid",
};

export interface SidebarSection {
  id: string;
  label: string;
  items: NavItem[];
}

/** Desktop sidebar groups — Mobile Cash Vault */
export const sidebarSections: SidebarSection[] = [
  { id: "dashboard", label: "Dashboard", items: [homeNav] },
  {
    id: "generate",
    label: "Generate",
    items: [
      { path: "/write", label: "Craft", icon: "PenLine", feature: "article-wizard" },
      { path: "/images", label: "Visual Lab", icon: "Image", feature: "article-images" },
    ],
  },
  {
    id: "publish",
    label: "Broadcast",
    items: [{ path: "/publish", label: "Broadcast", icon: "Send", feature: "article-publish" }],
  },
  {
    id: "library",
    label: "Library",
    items: [
      { path: "/links", label: "Link Vault", icon: "Link2", feature: "money-links-vault" },
      { path: "/vault", label: "My Vault", icon: "FileText", feature: "portfolio" },
    ],
  },
  {
    id: "training",
    label: "Training",
    items: [{ path: "/training", label: "Academy", icon: "GraduationCap", feature: "training" }],
  },
];

/** Core writing tools — Mobile Cash Vault */
export const vaultToolNav: NavItem[] = sidebarSections
  .filter((section) => section.id === "generate" || section.id === "publish" || section.id === "library")
  .flatMap((section) => section.items);

/** Core affiliate workflow: search → analysis → radar → replies */
export const workflowSteps: NavItem[] = [
  { path: "/search", label: "Step 1: Enter Topic", icon: "Search", feature: "core-workflow", workflowStep: 1 },
  { path: "/analysis", label: "Step 2: Check Demand", icon: "Brain", feature: "core-workflow", workflowStep: 2, requiresWorkflowStep: 1 },
  { path: "/radar", label: "Step 3: Find Ads", icon: "Radar", feature: "core-workflow", workflowStep: 3, requiresWorkflowStep: 2 },
  { path: "/replies", label: "Step 4: Create Replies", icon: "MessageSquare", feature: "core-workflow", workflowStep: 4, requiresWorkflowStep: 3 },
];

/** Extraction workflow home (connect → scan dashboard) */
export const extractionWorkflowSteps: NavItem[] = [
  { path: "/dashboard", label: "Home", icon: "LayoutGrid", feature: "extraction-workflow", workflowStep: 1 },
];

/** Single-page sales offer generator (all wizard steps) */
export const blogBuilderWorkflowSteps: NavItem[] = [
  { path: "/sales-offer-generator", label: "Sales Offer Generator", icon: "Rocket", feature: "blog-builder" },
];

/** Generate tools — sales pages and social promotions */
export const blogBuilderGenerateNav: NavItem[] = [];

/** Saved links and generated offers */
export const blogBuilderLibrariesNav: NavItem[] = [
  { path: "/link-vault", label: "Links Library", icon: "Link2", feature: "blog-builder" },
  { path: "/offers", label: "Offers Library", icon: "FolderOpen", feature: "blog-builder" },
];

/** @deprecated Use blogBuilderGenerateNav and blogBuilderLibrariesNav */
export const blogBuilderCoreNav: NavItem[] = [
  ...blogBuilderGenerateNav,
  ...blogBuilderLibrariesNav,
];

/** @deprecated Use blogBuilderGenerateNav and blogBuilderLibrariesNav */
export const blogBuilderResourceNav: NavItem[] = blogBuilderCoreNav;

export const blogBuilderGenerateSectionLabel = "Generate";
export const blogBuilderLibrariesSectionLabel = "Libraries";

/** Footer support link — rendered above account in the sidebar */
export const supportNav: NavItem = {
  path: "/support",
  label: "Support",
  icon: "Headphones",
};

/** Core sidebar resources — academy is feature-gated */
export const coreResourceNav: NavItem[] = sidebarSections
  .filter((section) => section.id === "training")
  .flatMap((section) => section.items);

export const resourceNav: NavItem[] = [];

/** Legacy upgrade nav — prefer premiumNav for new products */
export const upgradeNav: NavItem[] = [
  { path: "/autopilot", label: "Automated Profits", icon: "Rocket", feature: "premium-autopilot" },
];

/** Premium section — single source for sidebar, bottom nav, dashboard widget */
export const premiumNav: NavItem[] = [
  { path: "/dfy-profit", label: "Done-For-You Profit", icon: "Wallet", feature: "premium-dfy-profit" },
  { path: "/autopilot", label: "Automated Profits", icon: "Rocket", feature: "premium-autopilot" },
  { path: "/social-payouts", label: "Social Payouts", icon: "Globe", feature: "premium-social" },
  { path: "/infinite", label: "Unlimited", icon: "FileText", feature: "premium-infinite" },
  { path: "/recurring-wealth", label: "Guaranteed High-Ticket Payouts", icon: "Repeat", feature: "premium-recurring" },
  { path: "/protector", label: "Vault Protector", icon: "ShieldCheck", feature: "protector" },
  { path: "/license-rights", label: "Reseller & License Rights", icon: "FileText", feature: "premium-license-rights" },
];

export const premiumSectionLabel = "Vault Upgrades";

/** Primary mobile bottom tabs — first 4 visible tabs + "More" */
export const bottomNavTabs: NavItem[] = [
  homeNav,
  { path: "/write", label: "Craft", icon: "PenLine", feature: "article-wizard" },
  { path: "/publish", label: "Broadcast", icon: "Send", feature: "article-publish" },
  { path: "/training", label: "Academy", icon: "GraduationCap", feature: "training" },
];

/** Extra links for mobile "More" sheet — workflow, generate, libraries, and resources are merged in getBottomNavMoreLinks() */
export const bottomNavMoreLinks: NavItem[] = [];
