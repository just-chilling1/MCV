import { support } from "./support.config";
import { trainingContent } from "./training.config";

export type PromoTemplate =
  | "horizontal-banner"
  | "footer-card"
  | "sidebar-card"
  | "modal"
  | "toast";

export type PromoPlacement =
  | "global-top"
  | "global-footer"
  | "sidebar"
  | "modal"
  | "toast-bl";

export interface PromoSlot {
  id: string;
  enabled: boolean;
  template: PromoTemplate;
  placement: PromoPlacement;
  content: {
    headline?: string;
    body?: string | string[];
    ctaLabel?: string;
    ctaUrl?: string;
    icon?: string;
    badge?: string;
    bullets?: string[];
    scarcity?: { current: number; total: number; label: string };
    subtitle?: string;
    title?: string;
    stats?: { icon: string; text: string; highlight?: string }[];
    sidebarSubtitle?: string;
    toastAmount?: string;
    toastMessage?: string;
  };
  behavior?: {
    delayMs?: number;
    sessionKey?: string;
    intervalMinMs?: number;
    intervalMaxMs?: number;
    pauseWhenSlotId?: string;
    priority?: number;
  };
}

export const promoSlots: PromoSlot[] = [
  {
    id: "global-top",
    enabled: false,
    template: "horizontal-banner",
    placement: "global-top",
    content: {
      headline: "Want To Multiply Your Results?",
      body: [
        "Your core product is powerful — unlock advanced training to scale further.",
        "This training is free for all members. Tap the button below to learn more.",
      ],
      ctaLabel: "Click Here To Learn How",
      ctaUrl: trainingContent.externalTrainingUrl,
      icon: "Smartphone",
    },
  },
  {
    id: "global-footer",
    enabled: false,
    template: "footer-card",
    placement: "global-footer",
    content: {
      title: "Need Help?",
      subtitle: "Our support team is here for you 24/7",
      ctaLabel: "Contact Support",
      ctaUrl: support.contactUrl,
      icon: "Headphones",
      stats: [
        { icon: "clock", text: "Avg response:", highlight: "under 2 hours" },
        { icon: "star", text: "4.9/5 support rating" },
        { icon: "shield", text: "98% satisfaction rate" },
      ],
    },
  },
  // Sidebar ads are driven by offers.config getExclusiveOffers() — keep these off
  // to avoid a second divergent source of URLs.
  {
    id: "sidebar-promo-1",
    enabled: false,
    template: "sidebar-card",
    placement: "sidebar",
    content: {
      headline: "Earn $400/Day Testing New Apps",
      ctaUrl: "https://example.com/offer-1",
      sidebarSubtitle: "Claim Now",
    },
  },
  {
    id: "sidebar-promo-2",
    enabled: false,
    template: "sidebar-card",
    placement: "sidebar",
    content: {
      headline: "Get Paid To Copy & Paste",
      ctaUrl: "https://example.com/offer-2",
      sidebarSubtitle: "Claim Now",
    },
  },
  {
    id: "sidebar-promo-3",
    enabled: false,
    template: "sidebar-card",
    placement: "sidebar",
    content: {
      headline: "Fast Cash Training",
      ctaUrl: trainingContent.externalTrainingUrl,
      sidebarSubtitle: "Claim Now",
    },
  },
  {
    id: "onboarding-claim",
    enabled: false,
    template: "modal",
    placement: "modal",
    content: {
      badge: "OPTIONAL OFFER",
      headline: "Partner Opportunity",
      ctaLabel: "Learn More",
      ctaUrl: "https://example.com/partner",
    },
  },
  {
    id: "modal-training",
    enabled: false,
    template: "modal",
    placement: "modal",
    content: {
      badge: "LIMITED FREE TRAINING",
      headline: "Exclusive Member Training",
      body: "Learn the advanced system members use to scale results.",
      bullets: [
        "Step-by-step walkthrough",
        "Copy-paste templates included",
        "Works with any niche",
      ],
      scarcity: { current: 8, total: 10, label: "spots claimed today" },
      ctaLabel: "Get Free Access Now",
      ctaUrl: trainingContent.externalTrainingUrl,
    },
    behavior: {
      delayMs: 800,
      sessionKey: "skeleton_training_popup",
    },
  },
  {
    id: "toast-withdraw",
    enabled: false,
    template: "toast",
    placement: "toast-bl",
    content: {
      headline: "Withdrawal Available",
      toastAmount: "$0.00",
      toastMessage: "You may be eligible to withdraw earnings",
      ctaLabel: "Claim Now",
      ctaUrl: "https://example.com/withdraw",
    },
    behavior: {
      delayMs: 2500,
      sessionKey: "skeleton_withdraw_shown",
      priority: 10,
    },
  },
  {
    id: "toast-social",
    enabled: false,
    template: "toast",
    placement: "toast-bl",
    content: {
      headline: "Member Activity",
      toastMessage: "just earned",
      toastAmount: "$0",
    },
    behavior: {
      intervalMinMs: 15000,
      intervalMaxMs: 25000,
      pauseWhenSlotId: "toast-withdraw",
      priority: 1,
    },
  },
];

export function applyPromoSlotPatch(
  id: string,
  patch: { enabled?: boolean; headline?: string; title?: string; ctaLabel?: string; ctaUrl?: string }
) {
  const slot = promoSlots.find((item) => item.id === id);
  if (!slot) return;
  if (typeof patch.enabled === "boolean") slot.enabled = patch.enabled;
  if (patch.headline) slot.content.headline = patch.headline;
  if (patch.title) slot.content.title = patch.title;
  if (patch.ctaLabel) slot.content.ctaLabel = patch.ctaLabel;
  if (patch.ctaUrl) slot.content.ctaUrl = patch.ctaUrl;
}

export function getPromoSlot(id: string): PromoSlot | undefined {
  return promoSlots.find((s) => s.id === id && s.enabled);
}

export function getPromosByPlacement(placement: PromoPlacement): PromoSlot[] {
  return promoSlots.filter((s) => s.placement === placement && s.enabled);
}

/** True when modal or toast promos are enabled (skip PromoOrchestrator bundle otherwise). */
export function hasEnabledPromoOrchestrator(): boolean {
  return promoSlots.some(
    (s) => s.enabled && (s.placement === "modal" || s.placement === "toast-bl")
  );
}
