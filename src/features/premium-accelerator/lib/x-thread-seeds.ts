import { THREAD_POST_ROLES } from "@/features/publish-kit/lib/promote-constants";

/** Placeholder used in template HTML — replaced when a member clones. */
export const ACCELERATOR_LINK_PLACEHOLDER = "[AFFILIATE_LINK]";

/** Placeholder in thread post 10 — replaced with the member's offer page URL on clone. */
export const ACCELERATOR_THREAD_LINK_PLACEHOLDER = "[LINK]";

/** Minimum character counts per post role — used to detect corrupted stored threads. */
const THREAD_MIN_CHARS = [120, 100, 90, 180, 80, 180, 70, 90, 90, 80] as const;

const LINK_CTA_SUFFIX =
  /\s*(?:start here|grab it|get it|check it out|learn more|link in bio|link below)\s*:?\s*$/i;

/** Literal replace — never use RegExp ([LINK] is a regex character class). */
export function removeThreadLinkPlaceholder(text: string): string {
  return text.split(ACCELERATOR_THREAD_LINK_PLACEHOLDER).join("");
}

export function substituteThreadLinkPlaceholder(text: string, linkUrl: string): string {
  return text.split(ACCELERATOR_THREAD_LINK_PLACEHOLDER).join(linkUrl);
}

export function ensureFinalPostHasLink(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.includes(ACCELERATOR_THREAD_LINK_PLACEHOLDER)) {
    return `${trimmed}\n\nStart here: ${ACCELERATOR_THREAD_LINK_PLACEHOLDER}`;
  }
  return trimmed;
}

/** Remove all link placeholders and CTA tails from posts 1–9. */
export function stripLinkFromNonFinalPost(text: string): string {
  let cleaned = text.replace(/https?:\/\/[^\s]+/g, "");
  cleaned = removeThreadLinkPlaceholder(cleaned);
  cleaned = cleaned.split(ACCELERATOR_LINK_PLACEHOLDER).join("");
  cleaned = cleaned.replace(LINK_CTA_SUFFIX, "").trim();
  return cleaned.replace(/\s{2,}/g, " ").trim();
}

/** Normalize the CTA post — link only in the final line. */
export function normalizeFinalThreadPost(text: string): string {
  let cleaned = text.replace(/https?:\/\/[^\s]+/g, "");
  cleaned = removeThreadLinkPlaceholder(cleaned);
  cleaned = cleaned.split(ACCELERATOR_LINK_PLACEHOLDER).join("");
  cleaned = cleaned.replace(LINK_CTA_SUFFIX, "").trim();
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return ensureFinalPostHasLink(cleaned);
}

export function isValidAcceleratorThreadRows(
  rows: Pick<AcceleratorThreadSeedRow, "text">[]
): boolean {
  if (rows.length < THREAD_MIN_CHARS.length) return false;

  for (let i = 0; i < THREAD_MIN_CHARS.length; i++) {
    const text = rows[i]?.text?.trim() ?? "";
    if (text.length < THREAD_MIN_CHARS[i]) return false;
    if (i < THREAD_MIN_CHARS.length - 1 && text.includes(ACCELERATOR_THREAD_LINK_PLACEHOLDER)) {
      return false;
    }
  }

  return rows[THREAD_MIN_CHARS.length - 1]?.text.includes(ACCELERATOR_THREAD_LINK_PLACEHOLDER) ?? false;
}

/** Detect threads corrupted by regex placeholder handling (stripped letters / injected links). */
export function isAcceleratorThreadCorrupted(
  rows: Pick<AcceleratorThreadSeedRow, "text">[]
): boolean {
  return !isValidAcceleratorThreadRows(rows);
}

export interface AcceleratorThreadSeedRow {
  text: string;
  angle: string;
}

/** Niche-specific story beats — keeps threads concrete while following the 10-post arc. */
const NICHE_STORY_BEATS: Record<
  string,
  { hookMetric: string; scene: string; stakes: string; proof: string }
> = {
  fitness: {
    hookMetric: "11 pounds in 6 weeks",
    scene: "January 2024. Gym parking lot, 5:45am. I'd skipped workouts 4 weeks straight.",
    stakes: "Another month like that and I'd cancel the membership - and keep buying programs I'd never open.",
    proof: "Week 6: down 11 pounds, same 3 workouts, no extra cardio.",
  },
  finance: {
    hookMetric: "$840 saved in 9 weeks",
    scene: "April 2024. Kitchen table, bills spread out. I was $200 short every month.",
    stakes: "One more overdraft fee and I'd stop looking at the account altogether.",
    proof: "Nine weeks later: $840 saved with one weekly money review.",
  },
  health: {
    hookMetric: "energy back by week 5",
    scene: "March 2024. Afternoon crash at 2pm - again. Third coffee didn't help.",
    stakes: "If I kept ignoring it, I'd normalize feeling exhausted every single day.",
    proof: "By week 5 I had steady afternoon energy with 3 small daily habits.",
  },
  business: {
    hookMetric: "first $500 week in 8 weeks",
    scene: "February 2024. Laptop open at midnight. Zero sales after 60 days of posting.",
    stakes: "Another month of random tactics and I'd quit before I ever saw a real result.",
    proof: "Week 8: first $500 week from the same 3 actions repeated every Monday.",
  },
  default: {
    hookMetric: "first real win in 6 weeks",
    scene: "March 2024. Kitchen table, 11pm. I'd tried 3 approaches and still had nothing to show.",
    stakes: "If nothing changed, I'd keep burning weekends on tactics that looked smart but never paid off.",
    proof: "Six weeks later: first consistent result. Same 3 actions, less than an hour a day.",
  },
};

function resolveStoryBeats(nicheKey: string | undefined, nicheLabel: string) {
  const key = (nicheKey ?? nicheLabel).toLowerCase();
  if (key.includes("fit") || key.includes("weight")) return NICHE_STORY_BEATS.fitness;
  if (key.includes("financ") || key.includes("money")) return NICHE_STORY_BEATS.finance;
  if (key.includes("health") || key.includes("wellness")) return NICHE_STORY_BEATS.health;
  if (key.includes("business") || key.includes("market") || key.includes("affiliate")) {
    return NICHE_STORY_BEATS.business;
  }
  return NICHE_STORY_BEATS.default;
}

/**
 * Static fallback 10-post story threads when AI generation is unavailable.
 * Mirrors the x-thread-rules arc: failure in post 4, product in posts 7+10, link only in post 10.
 */
export function buildStaticAcceleratorXThreadSeeds(
  productName: string,
  niche: string,
  nicheKey?: string
): string[] {
  const short = productName.slice(0, 50);
  const nicheLower = niche.toLowerCase();
  const beats = resolveStoryBeats(nicheKey, niche);

  return [
    `I tracked ${beats.hookMetric} in ${nicheLower} - then one Tuesday night I almost quit for good. What happened next still surprises me.`,
    `${beats.scene} The coffee had gone cold. My phone showed dozens of saved tabs and zero real progress. I remember thinking: this can't be how it's supposed to work.`,
    `${beats.stakes} Another month like that and I wasn't just losing time - I was losing the belief that I could ever figure this out.`,
    `Attempt 1: free YouTube deep dives every weekend - tons of ideas, no structure, nothing stuck. Attempt 2: a $197 course - solid theory, zero fit for my actual schedule. Attempt 3: copying what influencers posted - looked busy, changed nothing.`,
    `The shift wasn't doing more. It was when I stopped collecting tips and started running one repeatable loop - same day, same three actions, no exceptions.`,
    `Pick one outcome for the next 30 days. Strip it to 3 weekly actions you can finish in under an hour. Track one number - just one. Review every Sunday before the week starts. Boring? Yes. And it works without buying a single thing.`,
    `${short} is what made that weekly loop fast enough that I actually stuck with it past week 3 - when I usually bail.`,
    `${beats.proof} Same routine. Less guessing. The metric finally moved because I stopped restarting every Monday.`,
    `Not for people chasing overnight wins or who won't review one number every week. If that sounds like you, save your money - this isn't it.`,
    `One path. One metric. One tool if you want speed instead of friction.\n\nStart here: ${ACCELERATOR_THREAD_LINK_PLACEHOLDER}`,
  ];
}

export function buildStaticAcceleratorXThreadSeedRows(
  productName: string,
  niche: string,
  nicheKey?: string
): AcceleratorThreadSeedRow[] {
  const texts = buildStaticAcceleratorXThreadSeeds(productName, niche, nicheKey);
  return texts.map((text, i) => ({
    text,
    angle: THREAD_POST_ROLES[i] ?? `Post ${i + 1}`,
  }));
}
