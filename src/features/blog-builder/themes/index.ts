import type { ThemeConfig } from "../types";
import type { ThemeColors, ThemePresetDef, ResolvedTheme } from "./types";
import { THEME_PRESETS, PRESET_IDS } from "./presets";
import { defaultThemeConfigFromTemplates } from "./ready-templates";

export { THEME_PRESETS, PRESET_IDS };
export {
  READY_TEMPLATES,
  readyTemplateAccent,
  readyTemplateToConfig,
  findMatchingReadyTemplateId,
  getReadyTemplate,
  getReadyTemplateFromConfig,
  defaultThemeConfigFromTemplates,
} from "./ready-templates";
export type { ReadyTemplate, TemplateStructureId } from "./ready-templates";
export { resolveTheme, resolvePublicSiteTheme, isRecurringWealthSite, RECURRING_PREMIUM_THEME_KEY } from "./resolve-theme";
export { pickThemeForSite, pickThemeForRecurringSite } from "./pick-theme";
export { buildSiteTitle, buildSiteTagline, getPublicBrand } from "./public-branding";
export { SiteHomeView } from "./SiteHomeView";
export { SitePostView } from "./SitePostView";
export { ProductSiteView } from "./ProductSiteView";
export type {
  ThemePreset,
  ResolvedTheme,
  ThemeModules,
  PublicSite,
  PublicPost,
  PublicPostSummary,
} from "./types";

/** Kickoff presets — exclude recurring-premium from picker */
export const KICKOFF_PRESET_IDS = PRESET_IDS.filter((id) => id !== "recurring-premium");

export const HEADING_FONT_OPTIONS = [
  { value: "'Instrument Serif', Georgia, serif", label: "Instrument Serif" },
  { value: "'Fraunces', Georgia, serif", label: "Fraunces" },
  { value: "'Newsreader', Georgia, serif", label: "Newsreader" },
  { value: "'Plus Jakarta Sans', system-ui, sans-serif", label: "Plus Jakarta Sans" },
  { value: "'Playfair Display', Georgia, serif", label: "Playfair Display" },
  { value: "'Syne', system-ui, sans-serif", label: "Syne" },
  { value: "'Outfit', system-ui, sans-serif", label: "Outfit" },
];

export const BODY_FONT_OPTIONS = [
  { value: "'DM Sans', system-ui, sans-serif", label: "DM Sans" },
  { value: "'Manrope', system-ui, sans-serif", label: "Manrope" },
  { value: "'Inter', system-ui, sans-serif", label: "Inter" },
  { value: "'Plus Jakarta Sans', system-ui, sans-serif", label: "Plus Jakarta Sans" },
  { value: "'Source Sans 3', system-ui, sans-serif", label: "Source Sans 3" },
  { value: "'Outfit', system-ui, sans-serif", label: "Outfit" },
];

export const ACCENT_VARIANTS: Record<string, string[]> = {
  editorial: ["#0f766e", "#0369a1", "#059669", "#b45309"],
  magazine: ["#ea580c", "#dc2626", "#0369a1", "#ca8a04"],
  minimal: ["#2563eb", "#0d9488", "#0369a1", "#18181b"],
  authority: ["#0369a1", "#0f766e", "#059669", "#b45309"],
  "affiliate-pro": ["#059669", "#0284c7", "#d97706", "#0369a1"],
};

/** Purple / magenta accent swatches removed from the picker — remap if stored in session. */
export const MAGENTA_ACCENT_COLORS = new Set([
  "#7c3aed",
  "#9333ea",
  "#4338ca",
  "#6366f1",
  "#a855f7",
  "#c026d3",
  "#d946ef",
  "#db2777",
  "#ec4899",
]);

export function sanitizeAccentColor(accent: string | undefined, fallback: string): string {
  if (!accent) return fallback;
  const normalized = accent.trim().toLowerCase();
  if (MAGENTA_ACCENT_COLORS.has(normalized)) return fallback;
  return accent;
}

export function getPreset(id: string): ThemePresetDef {
  return THEME_PRESETS[id] ?? THEME_PRESETS.editorial;
}

export function resolveThemeConfig(config: ThemeConfig | null | undefined): {
  preset: ThemePresetDef;
  colors: ThemeColors;
  headingFont: string;
  bodyFont: string;
} {
  const presetId = config?.presetId && THEME_PRESETS[config.presetId] ? config.presetId : "editorial";
  const preset = getPreset(presetId);
  const accent = sanitizeAccentColor(config?.accentOverride, preset.colors.accent);

  return {
    preset,
    colors: {
      ...preset.colors,
      accent,
      accentHover: accent,
      gradientFrom: accent,
    },
    headingFont: config?.headingFont ?? preset.fonts.heading,
    bodyFont: config?.bodyFont ?? preset.fonts.body,
  };
}

/** Merge user theme_config overrides onto a resolved public theme. */
export function applyThemeConfig(base: ResolvedTheme, config?: ThemeConfig | null): ResolvedTheme {
  if (!config) return base;
  const resolved = resolveThemeConfig(config);
  return {
    ...base,
    colors: { ...base.colors, ...resolved.colors },
    fonts: {
      ...base.fonts,
      heading: resolved.headingFont,
      body: resolved.bodyFont,
    },
  };
}

export function defaultThemeConfig(): ThemeConfig {
  return defaultThemeConfigFromTemplates();
}

export function themeFromConfig(config: ThemeConfig | null | undefined): string {
  return config?.presetId && THEME_PRESETS[config.presetId] ? config.presetId : "editorial";
}
