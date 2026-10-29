import { PRESET_IDS } from "./presets";
import { RECURRING_PREMIUM_THEME_KEY } from "./resolve-theme";

export function pickThemeForRecurringSite(): string {
  return RECURRING_PREMIUM_THEME_KEY;
}

/** Composites pair a strong homepage with a focused reading layout. */
const COMPOSITE_THEMES = [
  "magazine|minimal",
  "authority|minimal",
  "affiliate-pro|minimal",
  "editorial|authority",
  "magazine|authority",
] as const;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Deterministic theme assignment so each territory site gets a distinct look. */
export function pickThemeForSite(territory: string, userId: string): string {
  const hash = hashString(`${territory}:${userId}`);
  if (hash % 5 === 0) {
    return COMPOSITE_THEMES[hash % COMPOSITE_THEMES.length];
  }
  return PRESET_IDS[hash % PRESET_IDS.length];
}
