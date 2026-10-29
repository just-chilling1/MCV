import { NICHE_OPTIONS } from "@/features/blog-builder/types";
import type { NicheKey } from "@/features/blog-builder/lib/questionnaire-seeds";
import {
  READY_TEMPLATES,
  readyTemplateToConfig,
  type ReadyTemplate,
} from "@/features/blog-builder/themes/ready-templates";
import type { ThemeConfig } from "@/features/blog-builder/types";

export const ACCELERATOR_TARGET_COUNT = 200;

export interface AcceleratorCatalogEntry {
  id: number;
  nicheKey: NicheKey;
  nicheLabel: string;
  productName: string;
  productSlug: string;
  template: ReadyTemplate;
  themeConfig: ThemeConfig;
}

/** Product name stems — combined with niche label for 200 unique offers. */
const PRODUCT_STEMS = [
  "Complete Starter Guide",
  "Pro Method Blueprint",
  "Essential Toolkit",
  "Smart Choice System",
  "Results Accelerator",
  "Expert Path Program",
  "Daily Success Plan",
  "Premium Resource Hub",
  "Ultimate Quick-Start",
  "Trusted Insider Guide",
  "Step-by-Step Masterclass",
  "High-Impact Formula",
  "Beginner Breakthrough Kit",
  "Advanced Strategy Pack",
  "Proven Framework",
  "All-in-One Solution",
  "Fast-Track Playbook",
  "Insider Secrets Manual",
  "Complete Action Plan",
  "Elite Performance Guide",
  "Smart Buyer Checklist",
  "Next-Level Roadmap",
  "Power User Toolkit",
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/** Build the 200 accelerator catalog entries deterministically (no AI). */
export function buildAcceleratorCatalog(): AcceleratorCatalogEntry[] {
  const entries: AcceleratorCatalogEntry[] = [];
  let id = 1;

  while (entries.length < ACCELERATOR_TARGET_COUNT) {
    for (const niche of NICHE_OPTIONS) {
      for (const stem of PRODUCT_STEMS) {
        if (entries.length >= ACCELERATOR_TARGET_COUNT) break;
        const template = READY_TEMPLATES[(id - 1) % READY_TEMPLATES.length];
        const productName = `${niche.label} ${stem}`;
        entries.push({
          id,
          nicheKey: niche.value as NicheKey,
          nicheLabel: niche.label,
          productName,
          productSlug: slugify(`${niche.value}-${stem}-${id}`),
          template,
          themeConfig: readyTemplateToConfig(template),
        });
        id++;
      }
    }
  }

  return entries.slice(0, ACCELERATOR_TARGET_COUNT);
}

export function acceleratorTemplateKey(catalogId: number): string {
  return `accelerator-${catalogId}`;
}

export function getAcceleratorCatalogEntry(id: number): AcceleratorCatalogEntry | undefined {
  return buildAcceleratorCatalog().find((e) => e.id === id);
}

export const ACCELERATOR_NICHES = NICHE_OPTIONS.map((n) => n.label);
