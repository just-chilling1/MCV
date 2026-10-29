/** Local posters under `public/thumbnails/` — Mobile Cash Vault training kit. */

export type FeatureThumbKey =
  | "craft"
  | "visual-lab-broadcast"
  | "link-vault-my-vault"
  | "dfy-profit"
  | "automated-profits"
  | "social-payouts"
  | "unlimited"
  | "guaranteed-high-ticket"
  | "reseller-license"
  | "vault-protector";

const T = {
  d01: "/thumbnails/mcv-thumb-01-watch-this-first.png",
  d02: "/thumbnails/mcv-thumb-02-how-the-money-flows.png",
  d03: "/thumbnails/mcv-thumb-03-your-5-minute-tour.png",
  a04: "/thumbnails/mcv-thumb-04-craft.png",
  a05: "/thumbnails/mcv-thumb-05-visual-lab-broadcast.png",
  a06: "/thumbnails/mcv-thumb-06-link-vault-my-vault.png",
  p07: "/thumbnails/mcv-thumb-07-done-for-you-profit.png",
  p08: "/thumbnails/mcv-thumb-08-automated-profits.png",
  p09: "/thumbnails/mcv-thumb-09-social-payouts.png",
  p10: "/thumbnails/mcv-thumb-10-unlimited.png",
  p11: "/thumbnails/mcv-thumb-11-guaranteed-high-ticket.png",
  p12: "/thumbnails/mcv-thumb-12-reseller-license-rights.png",
  p13: "/thumbnails/mcv-thumb-13-vault-protector.png",
  m14: "/thumbnails/mcv-thumb-14-mindset-craft.png",
  m15: "/thumbnails/mcv-thumb-15-mindset-visual-lab-broadcast.png",
  m16: "/thumbnails/mcv-thumb-16-mindset-link-vault-my-vault.png",
  m17: "/thumbnails/mcv-thumb-17-mindset-done-for-you-profit.png",
  m18: "/thumbnails/mcv-thumb-18-mindset-automated-profits.png",
  m19: "/thumbnails/mcv-thumb-19-mindset-social-payouts.png",
  m20: "/thumbnails/mcv-thumb-20-mindset-unlimited.png",
  m21: "/thumbnails/mcv-thumb-21-mindset-guaranteed-high-ticket.png",
  m22: "/thumbnails/mcv-thumb-22-mindset-reseller-license-rights.png",
  m23: "/thumbnails/mcv-thumb-23-mindset-vault-protector.png",
} as const;

/** Dashboard video track — index 0–2 */
export const DASHBOARD_VIDEO_THUMBNAILS = [T.d01, T.d02, T.d03] as const;

/** Academy platform tutorials — Craft, Visual Lab & Broadcast, Link Vault & My Vault */
export const ACADEMY_PLATFORM_THUMBNAILS = [T.a04, T.a05, T.a06] as const;

/**
 * Academy premium tutorials — nav order:
 * DFY → Automated Profits → Social Payouts → Unlimited → Guaranteed High-Ticket → Reseller → Vault Protector
 */
export const ACADEMY_PREMIUM_THUMBNAILS = [
  T.p07,
  T.p08,
  T.p09,
  T.p10,
  T.p11,
  T.p12,
  T.p13,
] as const;

/** Mindset companions — same feature order as platform then premium */
export const ACADEMY_MINDSET_THUMBNAILS = [
  T.m14,
  T.m15,
  T.m16,
  T.m17,
  T.m18,
  T.m19,
  T.m20,
  T.m21,
  T.m22,
  T.m23,
] as const;

export const FEATURE_THUMBNAILS: Record<FeatureThumbKey, string> = {
  craft: T.a04,
  "visual-lab-broadcast": T.a05,
  "link-vault-my-vault": T.a06,
  "dfy-profit": T.p07,
  "automated-profits": T.p08,
  "social-payouts": T.p09,
  unlimited: T.p10,
  "guaranteed-high-ticket": T.p11,
  "reseller-license": T.p12,
  "vault-protector": T.p13,
};

/** Map known Vimeo IDs → posters (dashboard + academy + in-page players) */
export const VIDEO_THUMBNAILS: Record<string, string> = {
  // Dashboard (dashboard.config.ts)
  "1214915118": T.d01,
  "1214915117": T.d02,
  "1215368033": T.d03,
  // Platform (training.config.ts)
  "1215373563": T.a04,
  "1215508183": T.a05,
  "1215513309": T.a06,
  // Premium academy slots (training-content.config.ts)
  "1215530104": T.p10, // Unlimited (legacy id kept)
  "1215568587": T.p11,
  "1215574185": T.p09,
  "1215579801": T.p13,
  // In-page ACADEMY_TRAINING_VIDEOS / premium-feature-video
  "1213137238": T.a04,
  "1213138993": T.a05,
  "1213140795": T.a05,
  "1213143123": T.p09,
  "1213144701": T.p11,
  "1213146158": T.p08,
  "1213147133": T.p13,
  // Automated Profits in-page player
  "1171734563": T.p08,
};

const VIMEO_ID_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/;

export function getVideoThumbnailById(id: string): string | null {
  return VIDEO_THUMBNAILS[id] ?? null;
}

export function getDashboardVideoThumbnail(index: number): string | null {
  return DASHBOARD_VIDEO_THUMBNAILS[index] ?? null;
}

export function getAcademyPlatformThumbnail(index: number): string | null {
  return ACADEMY_PLATFORM_THUMBNAILS[index] ?? null;
}

export function getAcademyPremiumThumbnail(index: number): string | null {
  return ACADEMY_PREMIUM_THUMBNAILS[index] ?? null;
}

export function getAcademyMindsetThumbnail(index: number): string | null {
  return ACADEMY_MINDSET_THUMBNAILS[index] ?? null;
}

export function getFeatureThumbnail(key: FeatureThumbKey): string {
  return FEATURE_THUMBNAILS[key];
}

export function resolveVideoThumbnail(
  videoId: string,
  fallbackSrc?: string | null
): string | null {
  if (videoId) {
    return getVideoThumbnailById(videoId) ?? fallbackSrc ?? null;
  }
  return fallbackSrc ?? null;
}

export function toEmbedUrl(videoUrl: string, autoplay = true): string {
  const match = videoUrl.match(VIMEO_ID_REGEX);
  const id = match?.[1] ?? videoUrl.replace(/\D/g, "");
  const params = new URLSearchParams({
    badge: "0",
    byline: "0",
    portrait: "0",
    title: "0",
    autopause: "0",
    player_id: "0",
    app_id: "58479",
    dnt: "1",
    ...(autoplay ? { autoplay: "1" } : {}),
  });
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}
