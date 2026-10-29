const PRODUCT_NAME = "Mobile Cash Vault";

export const brand = {
  /** Software display name */
  productName: PRODUCT_NAME,
  storagePrefix: "mcv",
  tagline: "Craft, publish, and stack promotional assets",
  authTagline: "Secure member access",
  signupTagline: "Create your account",
  logo: {
    /** "icon" uses lucide icon; "image" uses public logo assets */
    type: "image" as "icon" | "image",
    icon: "Wallet",
    /** Full wordmark for expanded nav/header */
    src: "/logo.png",
    /** Square mark for collapsed sidebar and favicon */
    iconSrc: "/icon.png",
    alt: PRODUCT_NAME,
    /** Logo image already includes the product name */
    wordmark: true,
  },
  colors: {
    primary: "#D4AF37",
    secondary: "#4A6B5B",
    /** Bright gold type on dark surfaces; keep separate from muted sage */
    accentText: "#E6C65C",
    promoAccent: "#D4AF37",
    promoCta: "#D4AF37",
    page: "#04140A",
    sidebar: "#061A0E",
    panel: "#0A2414",
    textHeading: "#F2F5F0",
    textPrimary: "#F2F5F0",
    textMuted: "#8FA597",
    panelGlass: "#0A2414",
    tint: "#0E2E1A",
    borderGlow: "#4A6B5B",
    borderTeal: "#4A6B5B",
    border: "#1F3A2A",
    encryptedGreen: "#36C982",
    vaultGold: "#D4AF37",
  },
  fonts: {
    brand: "Fraunces",
    ui: "Inter",
  },
  get metadata() {
    return {
      title: `${PRODUCT_NAME} | Affiliate Sales & Promotions`,
      description: `Generate sales offers, promotion threads, and affiliate assets with ${PRODUCT_NAME}.`,
    };
  },
} as const;

export type BrandConfig = typeof brand;
