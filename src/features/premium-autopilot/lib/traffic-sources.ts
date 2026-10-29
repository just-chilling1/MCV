import { NICHE_OPTIONS } from "@/features/blog-builder/types";
import { CURATED_SOURCES_BY_NICHE } from "./curated-sources";
import { AUTOPILOT_NICHE_PROFILES } from "./niche-profiles";
import { buildPlatformSources, PLATFORM_PLAYBOOK_COUNT } from "./platform-playbooks";
import type { TrafficSource } from "./source-types";

export type { Difficulty, SourceType, TrafficSource } from "./source-types";

export const SOURCES_PER_NICHE = 20;
const CURATED_SOURCES_PER_NICHE = 8;

export const NICHES = ["All", ...NICHE_OPTIONS.map((niche) => niche.label)] as const;

export const SOURCES: TrafficSource[] = NICHE_OPTIONS.flatMap((niche) => {
  const profile = AUTOPILOT_NICHE_PROFILES[niche.value];
  return [
    ...CURATED_SOURCES_BY_NICHE[niche.value],
    ...buildPlatformSources(profile),
  ];
});

function assertCatalogShape(sources: readonly TrafficSource[]) {
  if (PLATFORM_PLAYBOOK_COUNT !== SOURCES_PER_NICHE - CURATED_SOURCES_PER_NICHE) {
    throw new Error(
      `Autopilot catalog requires ${SOURCES_PER_NICHE - CURATED_SOURCES_PER_NICHE} platform playbooks; received ${PLATFORM_PLAYBOOK_COUNT}.`
    );
  }

  const counts = new Map<string, number>();
  for (const source of sources) {
    counts.set(source.niche, (counts.get(source.niche) ?? 0) + 1);
  }

  for (const niche of NICHE_OPTIONS) {
    const count = counts.get(niche.label) ?? 0;
    if (count !== SOURCES_PER_NICHE) {
      throw new Error(
        `Autopilot catalog requires ${SOURCES_PER_NICHE} sources for ${niche.label}; received ${count}.`
      );
    }
  }
}

assertCatalogShape(SOURCES);

export function filterSourcesByNiche(niche: string): TrafficSource[] {
  if (niche === "All") return SOURCES;
  return SOURCES.filter((source) => source.niche === niche);
}

export function resolveAutopilotNiche(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === "all") return "All";

  const match = NICHE_OPTIONS.find(
    (niche) =>
      niche.value === normalized ||
      niche.label.toLowerCase() === normalized
  );

  return match?.label ?? "All";
}
