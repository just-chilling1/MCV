import { brand } from "@/config/brand.config";

/** CSS custom properties derived from brand.config — inject via BrandStyleProvider */
export function getBrandCssVars(): Record<string, string> {
  return {
    "--mcv-canvas": brand.colors.page,
    "--mcv-surface": brand.colors.panel,
    "--mcv-surface-sub": brand.colors.sidebar,
    "--bg-page": brand.colors.page,
    "--bg-sidebar": brand.colors.sidebar,
    "--bg-panel": brand.colors.panel,
    "--bg-panel-glass": brand.colors.panelGlass,
    "--bg-border": brand.colors.border,
    "--bg-border-glow": brand.colors.borderGlow,
    "--bg-border-teal": brand.colors.borderTeal,
    "--bg-glass": brand.colors.panelGlass,
    "--brand-primary": brand.colors.primary,
    "--brand-primary-readable": brand.colors.accentText,
    "--brand-secondary": brand.colors.secondary,
    "--brand-tint": brand.colors.tint,
    "--promo-accent": brand.colors.promoAccent,
    "--promo-cta": brand.colors.promoCta,
    "--text-heading": brand.colors.textHeading,
    "--text-primary": brand.colors.textPrimary,
    "--text-muted": brand.colors.textMuted,
    "--sidebar-gap": "2rem",
    "--mobile-header-h": "3.5rem",
  };
}

export function getAppUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
