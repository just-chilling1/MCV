export type Platform = "linkedin" | "medium" | "quora" | "reddit" | "twitter" | "facebook";

export type PromotePlatform = "twitter";

export interface PublishKitSite {
  siteId: string;
  siteName: string;
  siteUrl: string;
  territory: string;
  tagline: string | null;
  affiliateLink?: string;
  affiliateLabel?: string;
  status: string;
}

export interface SocialPostResult {
  text: string;
  angle?: string;
  imageUrl?: string;
}

export interface PromoteSocialResults {
  platform: PromotePlatform | null;
  posts: SocialPostResult[];
  tags: { tag: string; reason: string }[];
}
