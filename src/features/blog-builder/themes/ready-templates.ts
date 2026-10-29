import type { ThemeConfig } from "../types";
import { THEME_PRESETS } from "./presets";

export type TemplateStructureId =
  | "editorial"
  | "magazine"
  | "minimal"
  | "authority"
  | "conversion"
  | "luxury";

export interface ReadyTemplate {
  id: string;
  name: string;
  tagline: string;
  presetId: string;
  accentOverride?: string;
  headingFont?: string;
  bodyFont?: string;
  googleFontsUrl?: string;
  structureId: TemplateStructureId;
  copyToneId: TemplateStructureId;
  /** Short description of writing style shown in picker */
  toneLabel: string;
}

/** Three curated templates — each with distinct color, font, layout, and copy tone. */
export const READY_TEMPLATES: ReadyTemplate[] = [
  {
    id: "editorial-sage",
    name: "Editorial Sage",
    tagline: "Warm cream · Instrument Serif · story-driven scroll",
    presetId: "editorial",
    accentOverride: "#0f766e",
    structureId: "editorial",
    copyToneId: "editorial",
    toneLabel: "Thoughtful & narrative",
  },
  {
    id: "conversion-dark",
    name: "Conversion Pro",
    tagline: "Dark emerald · Syne · high-converting blocks",
    presetId: "affiliate-pro",
    accentOverride: "#059669",
    structureId: "conversion",
    copyToneId: "conversion",
    toneLabel: "Urgent & direct-response",
  },
  {
    id: "minimal-clarity",
    name: "Minimal Clarity",
    tagline: "Clean white · Newsreader · narrow reader layout",
    presetId: "minimal",
    accentOverride: "#2563eb",
    structureId: "minimal",
    copyToneId: "minimal",
    toneLabel: "Calm & precise",
  },
];

export function readyTemplateAccent(template: ReadyTemplate): string {
  if (template.accentOverride) return template.accentOverride;
  return THEME_PRESETS[template.presetId]?.colors.accent ?? "#0f766e";
}

export function readyTemplateToConfig(template: ReadyTemplate): ThemeConfig {
  const preset = THEME_PRESETS[template.presetId];
  return {
    templateId: template.id,
    presetId: template.presetId,
    accentOverride: template.accentOverride,
    headingFont: template.headingFont ?? preset?.fonts.heading,
    bodyFont: template.bodyFont ?? preset?.fonts.body,
  };
}

export function getReadyTemplate(id: string): ReadyTemplate {
  return READY_TEMPLATES.find((t) => t.id === id) ?? READY_TEMPLATES[0];
}

export function getReadyTemplateFromConfig(config: ThemeConfig | null | undefined): ReadyTemplate {
  if (config?.templateId) {
    const match = READY_TEMPLATES.find((t) => t.id === config.templateId);
    if (match) return match;
  }
  return getReadyTemplate(findMatchingReadyTemplateId(config ?? defaultThemeConfigFromTemplates()));
}

function configAccent(config: ThemeConfig): string {
  if (config.accentOverride) return config.accentOverride;
  return THEME_PRESETS[config.presetId]?.colors.accent ?? "#0f766e";
}

export function findMatchingReadyTemplateId(config: ThemeConfig): string {
  if (config.templateId && READY_TEMPLATES.some((t) => t.id === config.templateId)) {
    return config.templateId;
  }

  for (const template of READY_TEMPLATES) {
    const resolved = readyTemplateToConfig(template);
    if (
      resolved.presetId === config.presetId &&
      configAccent(resolved) === configAccent(config) &&
      (resolved.headingFont ?? "") === (config.headingFont ?? "") &&
      (resolved.bodyFont ?? "") === (config.bodyFont ?? "")
    ) {
      return template.id;
    }
  }
  return READY_TEMPLATES[0].id;
}

export function defaultThemeConfigFromTemplates(): ThemeConfig {
  return readyTemplateToConfig(READY_TEMPLATES[0]);
}
