import type { ArmedLink, ThemeConfig } from "../types";

export type HeaderModule = "centered" | "split" | "minimal";
export type HeroModule = "featured-pillar" | "none" | "cta-banner";
export type HomeListModule = "stack" | "grid-2" | "magazine-mix" | "bento" | "horizontal";
export type PostLayoutModule = "narrow" | "wide" | "sidebar";
export type FooterModule = "simple" | "rich";

export interface ThemeModules {
  header: HeaderModule;
  hero: HeroModule;
  homeList: HomeListModule;
  postLayout: PostLayoutModule;
  footer: FooterModule;
}

export interface ThemeColors {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentHover: string;
  border: string;
  pillar: string;
  heroOverlay: string;
  gradientFrom: string;
  gradientTo: string;
  accentSoft: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  googleUrl: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  tagline: string;
  fonts: ThemeFonts;
  colors: ThemeColors;
  modules: ThemeModules;
}

export type ThemePresetDef = ThemePreset;

export interface ResolvedTheme extends ThemePreset {
  themeKey: string;
}

export interface PublicSite {
  id: string;
  title: string;
  tagline: string | null;
  slug: string;
  hobby: string;
  territory?: string | null;
  theme: string;
  theme_config?: ThemeConfig | null;
  armed_links?: ArmedLink[];
  template_key?: string | null;
  is_template?: boolean;
}

export interface PublicPostSummary {
  title: string;
  slug: string;
  excerpt: string | null;
  is_pillar: boolean;
  created_at: string;
  image_url?: string | null;
}

export interface PublicPost extends PublicPostSummary {
  id: string;
  html: string;
  meta_description: string | null;
  image_url: string | null;
  image_alt: string | null;
  publish_at: string | null;
}
