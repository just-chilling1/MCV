import {
  READY_TEMPLATES,
  readyTemplateToConfig,
  type ReadyTemplate,
} from "@/features/blog-builder/themes/ready-templates";
import type { ThemeConfig } from "@/features/blog-builder/types";

export interface PickedTemplate {
  template: ReadyTemplate;
  themeConfig: ThemeConfig;
}

/** Uniform random pick from READY_TEMPLATES. Optionally exclude a prior id so re-rolls differ. */
export function pickRandomTemplate(excludeId?: string): PickedTemplate {
  const pool =
    excludeId && READY_TEMPLATES.length > 1
      ? READY_TEMPLATES.filter((t) => t.id !== excludeId)
      : READY_TEMPLATES;

  const template = pool[Math.floor(Math.random() * pool.length)] ?? READY_TEMPLATES[0];
  return {
    template,
    themeConfig: readyTemplateToConfig(template),
  };
}
