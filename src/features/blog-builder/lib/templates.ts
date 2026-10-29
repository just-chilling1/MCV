import type { ClusterTopic } from "../types";
import type { ArticleAngle } from "../types";
import { slugify } from "./seo";

/** Territory-specific topics mapped to SEO search-intent angles. */
export function buildClusterTopics(territory: string, hobby: string): ClusterTopic[] {
  const niche = territory.trim() || hobby.trim();
  const key = slugify(hobby.trim() || niche.slice(0, 48)) || "site";

  const topics: Array<ClusterTopic & { angle: ArticleAngle }> = [
    {
      title: `${niche}: The Complete Buyer's Guide`,
      slug: `${key}-complete-guide`,
      isPillar: true,
      angle: "pillar-guide",
    },
    {
      title: `Best Picks for ${niche}`,
      slug: `${key}-best-picks`,
      isPillar: false,
      angle: "best-picks",
    },
    {
      title: `7 Mistakes to Avoid With ${niche}`,
      slug: `${key}-mistakes`,
      isPillar: false,
      angle: "mistakes",
    },
    {
      title: `${niche} on a Budget — What Actually Works`,
      slug: `${key}-budget`,
      isPillar: false,
      angle: "budget",
    },
    {
      title: `Pro Tips: Getting Results With ${niche}`,
      slug: `${key}-pro-tips`,
      isPillar: false,
      angle: "pro-tips",
    },
    {
      title: `Is ${niche} Worth It? Honest Breakdown`,
      slug: `${key}-worth-it`,
      isPillar: false,
      angle: "worth-it",
    },
    {
      title: `${niche} for Beginners — Step by Step`,
      slug: `${key}-beginners`,
      isPillar: false,
      angle: "beginners",
    },
  ];

  return topics;
}

/** Title + angle patterns used to expand a niche into a large cluster site. */
const LARGE_CLUSTER_PATTERNS: Array<{ title: (n: string) => string; angle: ArticleAngle }> = [
  { title: (n) => `Best Picks for ${n}`, angle: "best-picks" },
  { title: (n) => `7 Mistakes to Avoid With ${n}`, angle: "mistakes" },
  { title: (n) => `${n} on a Budget — What Actually Works`, angle: "budget" },
  { title: (n) => `Pro Tips: Getting Results With ${n}`, angle: "pro-tips" },
  { title: (n) => `Is ${n} Worth It? Honest Breakdown`, angle: "worth-it" },
  { title: (n) => `${n} for Beginners — Step by Step`, angle: "beginners" },
  { title: (n) => `${n}: What to Look For Before You Buy`, angle: "pillar-guide" },
  { title: (n) => `Top ${n} Picks for First-Timers`, angle: "best-picks" },
  { title: (n) => `Common ${n} Problems and How to Fix Them`, angle: "mistakes" },
  { title: (n) => `${n} on a Tight Budget — Smart Choices`, angle: "budget" },
  { title: (n) => `Advanced ${n} Tactics That Actually Move the Needle`, angle: "pro-tips" },
  { title: (n) => `Who Should (and Shouldn't) Try ${n}`, angle: "worth-it" },
  { title: (n) => `Your First Week With ${n} — A Simple Plan`, angle: "beginners" },
  { title: (n) => `How to Choose the Right ${n} for You`, angle: "pillar-guide" },
  { title: (n) => `Best Value ${n} Options Compared`, angle: "best-picks" },
  { title: (n) => `5 Costly ${n} Mistakes Beginners Make`, angle: "mistakes" },
  { title: (n) => `Getting Started With ${n} Without Overspending`, angle: "budget" },
  { title: (n) => `${n}: Insider Tips Most People Miss`, angle: "pro-tips" },
  { title: (n) => `${n} Honest Review — Pros, Cons & Verdict`, angle: "worth-it" },
  { title: (n) => `${n} Basics Every Beginner Should Know`, angle: "beginners" },
  { title: (n) => `The Smart Buyer's Guide to ${n}`, angle: "pillar-guide" },
  { title: (n) => `Best ${n} for Different Needs and Goals`, angle: "best-picks" },
  { title: (n) => `What Nobody Tells You About ${n}`, angle: "mistakes" },
  { title: (n) => `Maximize Results From ${n} on Any Budget`, angle: "budget" },
];

/**
 * Build a large interlinked cluster (1 pillar + up to count-1 supporting posts)
 * for a full done-for-you product site. Slugs are unique within the set.
 */
export function buildLargeClusterTopics(
  territory: string,
  hobby: string,
  count = 25
): ClusterTopic[] {
  const niche = territory.trim() || hobby.trim();
  const key = slugify(hobby.trim() || niche.slice(0, 48)) || "site";

  const topics: ClusterTopic[] = [
    {
      title: `${niche}: The Complete Buyer's Guide`,
      slug: `${key}-complete-guide`,
      isPillar: true,
      angle: "pillar-guide",
    },
  ];

  const needed = Math.max(0, count - 1);
  for (let i = 0; i < needed; i++) {
    const pattern = LARGE_CLUSTER_PATTERNS[i % LARGE_CLUSTER_PATTERNS.length];
    topics.push({
      title: pattern.title(niche),
      slug: `${key}-c${i + 1}`,
      isPillar: false,
      angle: pattern.angle,
    });
  }

  return topics;
}

export function buildInternalLinks(
  topics: ClusterTopic[],
  siteSlug: string,
  currentSlug: string
): string {
  const pillar = topics.find((t) => t.isPillar);
  const clusters = topics.filter((t) => !t.isPillar && t.slug !== currentSlug).slice(0, 4);
  const links = [
    ...(pillar && pillar.slug !== currentSlug
      ? [`<li><a href="/sites/${siteSlug}/${pillar.slug}">${pillar.title}</a></li>`]
      : []),
    ...clusters.map(
      (t) => `<li><a href="/sites/${siteSlug}/${t.slug}">${t.title}</a></li>`
    ),
  ];
  if (links.length === 0) return "";
  return `<section class="sms-related" style="margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid #eee;">
    <h2 style="font-size:1.25rem;margin-bottom:1rem;">Related in this territory</h2>
    <ul style="line-height:1.8;padding-left:1.25rem;">${links.join("")}</ul>
  </section>`;
}
