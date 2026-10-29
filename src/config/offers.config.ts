/** Replace with real partner/affiliate URLs before launch */
export const PARTNER_LINK_PLACEHOLDER = "https://example.com/partner-offer";

export const offers = {
  /** Sidebar / bottom-nav exclusive offer slots — do not change these partner URLs */
  exclusiveOffer1: "https://jvz4.com/c/3547097/442443/",
  exclusiveOffer2: "https://perpetualincome365.convertri.com/7figure-everwebinar-registration#aff=DigitalAvalon&cam=membersarea",
  exclusiveOffer3: "https://jvz1.com/c/3547097/443257/",
  /** Withdraw / account-verified ad under video overlays */
  videoWithdrawUrl: "https://jvz1.com/c/3547097/442055/",
} as const;

export interface ExclusiveOffer {
  title: string;
  href: string;
  subtitle?: string;
}

/** Set true to show partner links in sidebar and mobile More sheet. */
export const exclusiveOffersEnabled = true;

let sidebarOverride: ExclusiveOffer[] | null = null;
let sidebarForceHidden = false;
let videoWithdrawOverride: string | null = null;

export function setSidebarOverride(next: ExclusiveOffer[] | null, enabled: boolean) {
  sidebarForceHidden = !enabled;
  sidebarOverride = next;
}

export function getVideoWithdrawUrl(): string {
  return videoWithdrawOverride ?? offers.videoWithdrawUrl;
}

export function setVideoWithdrawUrl(url: string) {
  videoWithdrawOverride = url.trim() || null;
}

/** Single source of truth for sidebar + mobile exclusive offers. */
export function getExclusiveOffers(): ExclusiveOffer[] {
  if (sidebarForceHidden) return [];
  if (sidebarOverride) return sidebarOverride.filter((offer) => offer.title.trim() && offer.href.trim());
  if (!exclusiveOffersEnabled) return [];
  return [
    {
      title: "Create your Q-LAPS2000 account",
      href: offers.exclusiveOffer1,
      subtitle: "Create Now",
    },
    {
      title: "Watch this Free training",
      href: offers.exclusiveOffer2,
      subtitle: "Watch Now",
    },
    {
      title: "Create you Cashapp Account",
      href: offers.exclusiveOffer3,
      subtitle: "CashTap AI",
    },
  ];
}
