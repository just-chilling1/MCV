import { THEME_PRESETS } from "./presets";
import type { ResolvedTheme, ThemeModules, ThemePreset } from "./types";
import type { ThemeConfig } from "../types";

/** Locked theme for Recurring Wealth cloned + template sites. */
export const RECURRING_PREMIUM_THEME_KEY = "recurring-premium";

const LEGACY_THEME_MAP: Record<string, string> = {
  obsidian: "editorial",
};

const DEFAULT_PRESET = THEME_PRESETS.editorial;

function mergeThemeConfig(base: ResolvedTheme, config?: ThemeConfig | null): ResolvedTheme {
  if (!config) return base;
  const preset = THEME_PRESETS[config.presetId] ?? DEFAULT_PRESET;
  const accent = config.accentOverride ?? base.colors.accent;
  return {
    ...base,
    colors: {
      ...base.colors,
      accent,
      accentHover: accent,
      gradientFrom: accent,
    },
    fonts: {
      ...base.fonts,
      heading: config.headingFont ?? preset.fonts.heading,
      body: config.bodyFont ?? preset.fonts.body,
    },
  };
}

export function isRecurringWealthSite(site: {
  template_key?: string | null;
  is_template?: boolean;
}): boolean {
  return Boolean(site.template_key?.startsWith("recurring-"));
}

/** Resolve theme for a public site, upgrading Recurring Wealth sites to the premium preset. */
export function resolvePublicSiteTheme(site: {
  theme: string;
  theme_config?: ThemeConfig | null;
  template_key?: string | null;
  is_template?: boolean;
}): ResolvedTheme {
  const key = isRecurringWealthSite(site) ? RECURRING_PREMIUM_THEME_KEY : site.theme;
  const base = resolveTheme(key);
  return mergeThemeConfig(base, site.theme_config);
}

function mergeModules(home: ThemePreset, post?: ThemePreset): ThemeModules {
  if (!post || post.id === home.id) return home.modules;
  return {
    header: home.modules.header,
    hero: home.modules.hero,
    homeList: home.modules.homeList,
    postLayout: post.modules.postLayout,
    footer: post.modules.footer,
  };
}

/**
 * Resolve a site theme string into a composable layout config.
 * Supports single presets (`editorial`) or composites (`magazine|minimal`).
 */
export function resolveTheme(themeKey: string | null | undefined): ResolvedTheme {
  const raw = (themeKey ?? "").trim() || DEFAULT_PRESET.id;
  const normalized = LEGACY_THEME_MAP[raw] ?? raw;
  const segments = normalized.split("|").map((s) => s.trim()).filter(Boolean);

  const homeId = segments[0] ?? DEFAULT_PRESET.id;
  const postId = segments[1];

  const home = THEME_PRESETS[homeId] ?? DEFAULT_PRESET;
  const post = postId ? THEME_PRESETS[postId] : undefined;

  return {
    ...home,
    themeKey: normalized,
    modules: mergeModules(home, post),
    name: post && post.id !== home.id ? `${home.name} × ${post.name}` : home.name,
  };
}
