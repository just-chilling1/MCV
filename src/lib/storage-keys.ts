import { brand } from "@/config/brand.config";

const prefix = brand.storagePrefix;

export const storageKeys = {
  sidebarCollapsed: `${prefix}_sidebar_collapsed`,
  workflowKeyword: `${prefix}_current_keyword`,
  workflowVariations: `${prefix}_current_variations`,
  workflowChip: `${prefix}_current_chip`,
  workflowAffiliate: `${prefix}_current_affiliate`,
  workflowSelectedPosts: `${prefix}_selected_posts`,
  workflowHistory: `${prefix}_history`,
  autopilotCompleted: `${prefix}_autopilot_completed`,
  licenseRightsRequest: `${prefix}_license_rights_request`,
} as const;
