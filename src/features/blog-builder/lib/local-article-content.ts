import type { ArticleAngle, GeneratedPostContent } from "../types";

const ANGLE_INTROS: Record<ArticleAngle, string> = {
  "pillar-guide":
    "If you are researching {territory}, this guide walks through what matters before you spend money — criteria we use, trade-offs to expect, and how to match a product to your goals.",
  "best-picks":
    "Looking for the best options in {territory}? Here is a practical shortlist organized by use case so you can compare value without wading through hype.",
  mistakes:
    "Most people waste money on {territory} by repeating the same mistakes. These are the pitfalls we see most often — and how to avoid them.",
  budget:
    "You do not need a huge budget to get started with {territory}. This guide focuses on what to prioritize first and where it pays to spend a little more.",
  "pro-tips":
    "Already familiar with {territory}? These advanced tips help you get better results faster — small changes that compound over time.",
  "worth-it":
    "Wondering whether {territory} is worth your time and money? Here is an honest breakdown of who benefits, who should skip it, and why.",
  beginners:
    "New to {territory}? Start here. This step-by-step plan covers the basics, your first-week checklist, and what to do next.",
};

function fill(template: string, territory: string): string {
  return template.replace(/\{territory\}/g, territory);
}

/** Offline template articles when AI is unavailable or fails during deploy. */
export function buildLocalArticleContent(params: {
  topic: string;
  territory: string;
  hobby: string;
  angle?: ArticleAngle;
  productContext?: string;
}): GeneratedPostContent {
  const territory = params.territory.trim() || params.hobby.trim() || "this niche";
  const angle = params.angle ?? "pillar-guide";
  const title = params.topic.trim().slice(0, 120);
  const intro = fill(ANGLE_INTROS[angle], territory);

  const productNote = params.productContext?.trim()
    ? `<p>Based on the offer we reviewed: ${params.productContext.trim().slice(0, 280)}.</p>`
    : "";

  const html = `
<p>${intro}</p>
${productNote}
<h2>What to look for</h2>
<p>Start with fit for your situation — budget, experience level, and how much time you can commit each week. Compare materials or features that actually affect day-to-day results in ${territory}, not marketing buzzwords.</p>
<p>When a specific program or product stands out for beginners, we usually point readers to <a href="#offer">the starter option we recommend first</a> — it balances value with a clear onboarding path.</p>
<h2>Common buying mistakes</h2>
<ul>
<li>Chasing the cheapest option without checking support or refund terms</li>
<li>Skipping reviews from people with similar goals as yours</li>
<li>Expecting overnight results instead of a realistic 30–90 day plan</li>
</ul>
<h2>Our quick verdict</h2>
<p>${territory} can be a solid choice when you match the product to your goals and follow a simple plan. Take notes on the criteria above, compare two or three options, and move forward with one clear next step this week.</p>
`.trim();

  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return {
    title,
    excerpt: plain.slice(0, 200),
    metaDescription: `${title} — practical tips, mistakes to avoid, and what to buy in ${territory}.`.slice(
      0,
      160
    ),
    html,
  };
}
