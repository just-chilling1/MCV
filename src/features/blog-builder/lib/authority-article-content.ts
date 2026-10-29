import type { ArticleAngle } from "../types";

export const RECURRING_ARTICLE_BODY_CLASS = "recurring-article-body";

export interface GeneratedArticleContent {
  title: string;
  excerpt: string;
  metaDescription: string;
  html: string;
  wordCount: number;
}

function countWords(html: string): number {
  return html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

function primaryKeyword(title: string, territory: string): string {
  const base = title.replace(/[^\w\s&]/g, " ").replace(/\s+/g, " ").trim();
  return base.length > 12 ? base.slice(0, 80) : territory;
}

function secondaryKeywords(territory: string, angle: ArticleAngle): string[] {
  const shared = [
    `${territory} guide`,
    `best ${territory.toLowerCase()} options`,
    `${territory.toLowerCase()} tips`,
    `${territory.toLowerCase()} for beginners`,
  ];
  const byAngle: Record<ArticleAngle, string[]> = {
    "pillar-guide": ["buyer's guide", "how to choose", "evaluation criteria"],
    "best-picks": ["top picks", "comparison", "use cases"],
    mistakes: ["common mistakes", "what to avoid", "buying errors"],
    budget: ["budget options", "value for money", "affordable choices"],
    "pro-tips": ["advanced strategies", "expert tips", "optimization"],
    "worth-it": ["pros and cons", "honest review", "is it worth it"],
    beginners: ["getting started", "step by step", "first steps"],
  };
  return [...shared, ...byAngle[angle]];
}

function externalResourcesForNiche(territory: string): { label: string; url: string }[] {
  const t = territory.toLowerCase();
  const byTheme: Record<string, { label: string; url: string }[]> = {
    "health & wellness": [
      { label: "CDC — Health Topics", url: "https://www.cdc.gov/health-topics.html" },
      { label: "NIH — Health Information", url: "https://www.nih.gov/health-information" },
    ],
    "finance & investing": [
      { label: "Investor.gov — Introduction", url: "https://www.investor.gov/introduction-investing" },
      { label: "Consumer Financial Protection Bureau", url: "https://www.consumerfinance.gov/" },
    ],
    "fitness & sports": [
      { label: "CDC — Physical Activity Basics", url: "https://www.cdc.gov/physical-activity-basics/" },
      { label: "WHO — Physical Activity", url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity" },
    ],
    "digital marketing": [
      { label: "Google Search Central Documentation", url: "https://developers.google.com/search/docs" },
      { label: "FTC — Advertising and Marketing", url: "https://www.ftc.gov/business-guidance/advertising-marketing" },
    ],
    "self-help & personal development": [
      { label: "American Psychological Association — Topics", url: "https://www.apa.org/topics" },
      { label: "NIH — Mental Health Information", url: "https://www.nimh.nih.gov/health" },
    ],
    "beauty & skincare": [
      { label: "FDA — Cosmetics", url: "https://www.fda.gov/cosmetics" },
      { label: "American Academy of Dermatology", url: "https://www.aad.org/public" },
    ],
    "education & learning": [
      { label: "U.S. Department of Education", url: "https://www.ed.gov/" },
      { label: "UNESCO — Education", url: "https://www.unesco.org/en/education" },
    ],
    "business & entrepreneurship": [
      { label: "U.S. Small Business Administration", url: "https://www.sba.gov/" },
      { label: "Harvard Business Review — Entrepreneurship", url: "https://hbr.org/topic/subject/entrepreneurship" },
    ],
    "travel & lifestyle": [
      { label: "U.S. State Department — Travel", url: "https://travel.state.gov/" },
      { label: "WHO — Travel and Health", url: "https://www.who.int/health-topics/travel-and-health" },
    ],
  };

  return (
    byTheme[t] ?? [
      { label: "Consumer Reports — Buying Guides", url: "https://www.consumerreports.org/cro/index.htm" },
      { label: "Federal Trade Commission — Consumer Advice", url: "https://consumer.ftc.gov/" },
    ]
  );
}

function relatedArticleTitles(territory: string): string[] {
  return [
    `${territory}: The Complete Buyer's Guide`,
    `Best Picks for ${territory}`,
    `7 Mistakes to Avoid With ${territory}`,
    `${territory} for Beginners — Step by Step`,
  ];
}

function featuredImageHtml(territory: string, title: string): string {
  const alt = `${title} — featured guide for ${territory.toLowerCase()}`;
  const seed = encodeURIComponent(territory.toLowerCase().replace(/\s+/g, "-"));
  return `
<figure>
<img src="https://picsum.photos/seed/${seed}/1200/630" alt="${alt}" width="1200" height="630" loading="lazy" />
<figcaption>Featured image: ${territory} guide — use descriptive alt text when publishing.</figcaption>
</figure>
`.trim();
}

function buildIntroduction(params: {
  title: string;
  territory: string;
  angle: ArticleAngle;
  keyword: string;
}): string {
  const { territory, angle, keyword } = params;
  const hookByAngle: Record<ArticleAngle, string> = {
    "pillar-guide": `Choosing the right path in ${territory} can feel overwhelming when every product promises fast results. This ${keyword.toLowerCase()} cuts through the noise with practical criteria you can use today — without hype or vague promises.`,
    "best-picks": `Not every ${territory.toLowerCase()} option fits every buyer. This comparison-style guide groups the strongest approaches by use case so you can match a solution to your goals without guesswork.`,
    mistakes: `Most people overspend on ${territory.toLowerCase()} because they repeat the same preventable errors. Understanding those mistakes early saves money, time, and frustration.`,
    budget: `You do not need a large budget to make progress in ${territory.toLowerCase()}. Smart prioritization often beats expensive shortcuts when you know what to fund first and what to defer.`,
    "pro-tips": `If you already understand the basics of ${territory.toLowerCase()}, small refinements often produce outsized gains. These advanced tactics focus on leverage, not hype.`,
    "worth-it": `Before you invest in ${territory.toLowerCase()}, you need an honest answer to a simple question: will this actually help someone with your goals, constraints, and timeline?`,
    beginners: `Starting with ${territory.toLowerCase()} does not require expert knowledge on day one. A clear sequence of first steps reduces confusion and helps you build momentum in your first week.`,
  };

  const secondaries = secondaryKeywords(territory, angle).slice(0, 4).join(", ");

  return `
<p>${hookByAngle[angle]}</p>
<p>In this article, you will learn how to evaluate ${territory.toLowerCase()} options with confidence, avoid common pitfalls, and choose a practical next step. We focus on evergreen advice that stays useful even as products and trends change.</p>
<p>Whether you are researching for the first time or refining an existing plan, the framework below is designed to answer real buyer questions — not filler. By the end, you will know what to prioritize, what to skip, and how to move forward with a realistic plan.</p>
<p>Our primary focus is <strong>${keyword.toLowerCase()}</strong>, with related topics such as ${secondaries} woven in where they add clarity.</p>
<p><strong>Example:</strong> A buyer who defines their budget and timeline before comparing options often eliminates 70% of poor fits in the first hour of research — because most offers are built for a different use case than the one they actually have.</p>
`.trim();
}

function buildTableOfContents(sections: string[]): string {
  const items = sections
    .map(
      (s) =>
        `<li><a href="#${s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}">${s}</a></li>`
    )
    .join("\n");
  return `
<h2>Table of Contents</h2>
<nav aria-label="Table of contents">
<ol>
${items}
</ol>
</nav>
`.trim();
}

function buildExamplesSection(territory: string, keyword: string): string {
  const t = territory.toLowerCase();
  return `
<h2 id="practical-examples">Practical ${territory} Examples</h2>
<p>Abstract advice rarely changes behavior. These short scenarios show how the framework works in real decisions.</p>
<h3>Example 1: The rushed buyer</h3>
<p>Someone sees a limited-time offer and purchases before comparing refund terms. Two weeks later, they realize the format requires daily sessions they cannot sustain. The fix: run every option through the step-by-step checklist before checkout — especially for <strong>${keyword.toLowerCase()}</strong>.</p>
<h3>Example 2: The over-researcher</h3>
<p>A buyer collects ten free resources but never executes one plan long enough to evaluate it. The fix: pick one structured path, commit for 30 days, and review a single metric weekly. Progress in ${t} comes from iteration, not infinite browsing.</p>
<h3>Example 3: The budget optimizer</h3>
<p>Instead of buying the premium tier immediately, a buyer starts with the core offer, validates fit, then upgrades only after completing a baseline cycle. This sequence protects cash while still moving forward.</p>
<blockquote><p><strong>Tip:</strong> Write a one-paragraph "why now" note before any purchase. If you cannot articulate the reason clearly, pause for 24 hours.</p></blockquote>
`.trim();
}

function buildMainSections(params: {
  territory: string;
  angle: ArticleAngle;
  keyword: string;
}): string {
  const { territory, angle, keyword } = params;
  const t = territory.toLowerCase();

  const evaluationSection = `
<h2 id="how-to-evaluate">How to Evaluate ${territory} Options</h2>
<p>Strong decisions in ${t} start with a short list of non-negotiables. Before comparing features or prices, define your goal, budget range, and time commitment. Those three inputs filter out most poor fits immediately.</p>
<h3>Quality markers that actually matter</h3>
<p>Look for transparent onboarding, clear refund terms, and support channels that respond within a reasonable window. In ${t}, the best providers explain trade-offs upfront instead of hiding limitations in fine print.</p>
<p>When a specific starter program aligns with beginners, we often point readers to <a href="#offer">the recommended starting option</a> because it balances clarity, support, and a realistic learning curve.</p>
<h4>Red flags to watch for</h4>
<ul>
<li>Vague outcome claims with no explanation of required effort</li>
<li>Pressure tactics that discourage reading terms before purchase</li>
<li>No clear answer to "who is this NOT for?"</li>
</ul>
<h3>Support, guarantees, and long-term value</h3>
<p>Guarantees are only meaningful when the process to use them is simple. Check whether updates, community access, or coaching are included — these details often determine whether you stick with a plan long enough to see results.</p>
<ul>
<li><strong>Clarity:</strong> Does the offer explain who it is for and who should skip it?</li>
<li><strong>Proof:</strong> Are outcomes described with realistic timelines instead of hype?</li>
<li><strong>Fit:</strong> Does the format match how you actually learn or work?</li>
<li><strong>Flexibility:</strong> Can you adjust pace if life gets busy?</li>
</ul>
<p><strong>Example:</strong> A landing page focused on one offer often converts better than a homepage because it removes distractions — the same principle applies when you evaluate ${keyword.toLowerCase()}: fewer variables make comparisons fairer.</p>
`.trim();

  const checklistSection = `
<h2 id="step-by-step-checklist">${territory} Step-by-Step Checklist</h2>
<p>Use this sequence before you commit to any purchase in ${t}. It keeps research structured and prevents impulse decisions driven by marketing urgency.</p>
<ol>
<li>Write down your primary outcome and a 30-day success metric.</li>
<li>List two alternatives and compare them against the same criteria.</li>
<li>Read recent feedback from people with similar goals — not generic five-star blurbs.</li>
<li>Confirm refund terms, billing cycles, and cancellation steps in writing.</li>
<li>Choose one option, set a start date, and schedule a two-week review.</li>
<li>Document what worked and what did not — reuse this note for future decisions.</li>
</ol>
<p>This approach works because it converts abstract interest in <strong>${keyword.toLowerCase()}</strong> into a repeatable decision process you can reuse any time the market changes.</p>
`.trim();

  const mistakesSection = `
<h2 id="common-mistakes">Common ${territory} Mistakes to Avoid</h2>
<p>Most setbacks in ${t} come from predictable errors rather than bad luck. Avoiding these patterns protects your budget and shortens your path to useful results.</p>
<ul>
<li><strong>Chasing the lowest price</strong> without checking support quality or update frequency.</li>
<li><strong>Skipping the refund window review</strong> and discovering restrictive terms after purchase.</li>
<li><strong>Expecting instant outcomes</strong> when the category typically rewards consistent effort over 30–90 days.</li>
<li><strong>Collecting resources without execution</strong> — more courses rarely fix a missing weekly routine.</li>
<li><strong>Ignoring fit</strong> by choosing a popular option that does not match your schedule or skill level.</li>
</ul>
<blockquote><p><strong>Warning:</strong> If an offer cannot explain who should skip it, treat that as a signal to slow down and compare alternatives.</p></blockquote>
`.trim();

  const angleSectionByType: Record<ArticleAngle, string> = {
    "pillar-guide": `
<h2 id="complete-overview">The Complete ${territory} Overview</h2>
<p>${territory} includes many subtopics, but successful buyers focus on fundamentals first: problem definition, solution fit, and execution plan. This section maps the landscape so you know where to spend attention.</p>
<h3>Who this guide is for</h3>
<p>This guide helps motivated beginners and intermediate buyers who want a structured framework — not hype. If you need a quick impulse purchase without research, this article will feel too detailed. That is intentional.</p>
<h3>Who should skip it</h3>
<p>If you already operate at an advanced level and only need niche-specific tactical updates, skim the checklist and FAQ sections rather than reading end-to-end.</p>
<h4>Core concepts to understand first</h4>
<p>Before comparing products, understand the problem you are solving, the constraints you operate under, and the minimum viable routine you can sustain. Those three inputs matter more than any feature list in ${t}.</p>
<p>For most readers, the combination of evaluation criteria, mistake prevention, and FAQ answers provides enough depth to choose confidently.</p>
`.trim(),
    "best-picks": `
<h2 id="best-picks-by-use-case">Best ${territory} Picks by Use Case</h2>
<p>Rather than declaring one universal winner, organize choices by scenario. The best pick for a tight budget differs from the best pick for faster guided implementation.</p>
<table>
<thead><tr><th>Use case</th><th>What to prioritize</th><th>Why it works</th></tr></thead>
<tbody>
<tr><td>First-time buyers</td><td>Clear onboarding + support</td><td>Reduces early confusion and drop-off</td></tr>
<tr><td>Budget-conscious</td><td>Core features without extras</td><td>Protects cash while validating fit</td></tr>
<tr><td>Time-poor professionals</td><td>Structured shortcuts</td><td>Minimizes decision fatigue each week</td></tr>
<tr><td>Long-term builders</td><td>Scalable systems</td><td>Supports compounding progress</td></tr>
</tbody>
</table>
<p>When your use case is clear, shortlist two options and run them through the checklist section before you decide.</p>
<p><strong>Example:</strong> A first-time buyer who prioritizes support over bonus modules typically completes onboarding faster than someone who chose the cheapest tier with no guidance.</p>
`.trim(),
    mistakes: `
<h2 id="mistake-patterns">Why These ${territory} Mistakes Keep Happening</h2>
<p>Mistakes repeat when buyers rely on urgency messaging instead of criteria. Sales pages optimize for conversion, not fit — your process must rebalance that asymmetry.</p>
<h3>How to recover quickly</h3>
<p>If you already made a suboptimal purchase, document what failed (expectations, format, support, or schedule mismatch). That note becomes your personal filter for future decisions in ${t}.</p>
<h3>Prevention systems that work</h3>
<p>Set a 24-hour cooling period for non-essential purchases, and require every option to pass the step-by-step checklist. These small rules prevent most regret purchases.</p>
<h4>Build a personal decision log</h4>
<p>Track what you considered, what you chose, and what happened 30 days later. Over time, this log becomes your most valuable asset in ${keyword.toLowerCase()}.</p>
`.trim(),
    budget: `
<h2 id="budget-framework">${territory} on a Budget: A Practical Framework</h2>
<p>Budget buying is not about finding the cheapest option. It is about allocating limited funds to the highest-leverage components first while avoiding expensive distractions.</p>
<h3>Spend first</h3>
<p>Fund the core capability that directly enables your primary outcome. In most ${t} scenarios, that means paying for clarity and implementation support before aesthetic upgrades or bonus modules.</p>
<h3>Save for later</h3>
<p>Defer advanced add-ons until you complete a baseline execution cycle. Many buyers upgrade too early and confuse consumption with progress.</p>
<h4>Sample budget tiers</h4>
<ul>
<li><strong>Starter:</strong> Core access only — validate fit before scaling spend.</li>
<li><strong>Growth:</strong> Add support or templates after 30 days of consistent use.</li>
<li><strong>Advanced:</strong> Invest in optimization tools once fundamentals are stable.</li>
</ul>
`.trim(),
    "pro-tips": `
<h2 id="advanced-tactics">Advanced ${territory} Tactics</h2>
<p>Once fundamentals are stable, advanced gains usually come from tighter feedback loops: better tracking, sharper positioning, and faster iteration cycles.</p>
<h3>Optimize your weekly review</h3>
<p>Block 20 minutes each week to review one metric, one bottleneck, and one adjustment. This habit compounds faster than constantly switching methods.</p>
<h3>Reduce context switching</h3>
<p>Most plateaus in ${t} trace back to fragmented focus. Commit to one primary approach long enough to evaluate it fairly.</p>
<h4>Compound improvements</h4>
<p>Improve one variable per week — offer positioning, follow-up timing, or onboarding clarity. Small stacked gains beat dramatic pivots every month.</p>
`.trim(),
    "worth-it": `
<h2 id="worth-it-analysis">Is ${territory} Worth It? Pros, Cons, and Verdict</h2>
<p>A balanced decision requires explicit pros and cons — not a highlight reel from the sales page.</p>
<h3>Pros</h3>
<ul>
<li>Can accelerate learning curves when the format matches your workflow</li>
<li>Provides structure that reduces guesswork for new buyers</li>
<li>Often includes templates, examples, or support that save setup time</li>
</ul>
<h3>Cons</h3>
<ul>
<li>Requires consistent execution — purchase alone does not create results</li>
<li>Quality varies widely across providers in ${t}</li>
<li>Some offers oversimplify timelines and create unrealistic expectations</li>
</ul>
<p><strong>Verdict:</strong> ${territory} is worth it when your chosen option aligns with your schedule, budget, and learning style — and you commit to a realistic 30–90 day execution window.</p>
`.trim(),
    beginners: `
<h2 id="beginner-roadmap">${territory} for Beginners: First-Week Roadmap</h2>
<p>Beginners progress fastest with a narrow plan. Avoid collecting every resource at once. Start with one path, one metric, and one weekly review ritual.</p>
<h3>Day 1–2: Define your baseline</h3>
<p>Write your goal, current constraints, and available weekly hours. This baseline prevents chasing tactics that do not fit your life.</p>
<h3>Day 3–5: Implement one core lesson</h3>
<p>Apply a single concept and capture what worked and what did not. Small validated steps beat passive reading every time.</p>
<h3>Day 6–7: Review and adjust</h3>
<p>Decide whether to continue, tweak, or switch approach. Early reviews protect you from staying on the wrong path for months.</p>
<h4>Your first metric</h4>
<p>Pick one number you can track weekly — completion rate, sessions completed, or leads generated. One metric creates clarity; ten metrics create confusion.</p>
`.trim(),
  };

  return [
    angleSectionByType[angle],
    evaluationSection,
    buildExamplesSection(territory, keyword),
    checklistSection,
    mistakesSection,
  ].join("\n\n");
}

function buildInternalLinksSection(territory: string): string {
  const links = relatedArticleTitles(territory)
    .map((title) => `<li>${title}</li>`)
    .join("\n");
  return `
<div class="related-links">
<h2 id="related-reading">Related Reading</h2>
<p>Explore these companion guides in ${territory.toLowerCase()} when you publish on your site:</p>
<ul>
${links}
</ul>
</div>
`.trim();
}

function buildExternalResourcesSection(territory: string): string {
  const links = externalResourcesForNiche(territory)
    .map((r) => `<li><a href="${r.url}" rel="noopener noreferrer" target="_blank">${r.label}</a></li>`)
    .join("\n");
  return `
<h2 id="trusted-resources">Trusted External Resources</h2>
<p>For fact-checking and deeper research, consult authoritative sources — not random blogs with no accountability.</p>
<ul>
${links}
</ul>
`.trim();
}

function buildFaqSection(territory: string, angle: ArticleAngle, keyword: string): string {
  const t = territory.toLowerCase();
  const faqs: { q: string; a: string }[] = [
    {
      q: `What is the best way to start with ${territory.toLowerCase()}?`,
      a: `Start by defining your goal and budget, then compare two or three options using the same checklist. For most beginners in ${t}, a structured starter option with clear onboarding reduces early mistakes.`,
    },
    {
      q: `How much should I budget for ${territory.toLowerCase()}?`,
      a: `Budget depends on your use case. Prioritize core value first, then add advanced features after you complete a baseline execution cycle. Avoid paying for premium extras before you validate fit.`,
    },
    {
      q: `How long before I see results?`,
      a: `Many buyers in ${t} should expect meaningful progress within 30–90 days of consistent action. Timelines vary by starting point, but overnight outcomes are rarely realistic.`,
    },
    {
      q: `What mistakes should I avoid?`,
      a: `The most common mistakes are choosing based on price alone, ignoring refund terms, and switching methods too frequently. Use a written decision checklist before purchasing.`,
    },
    {
      q: `Is ${keyword.toLowerCase()} worth it for beginners?`,
      a: `It can be, if the format matches your schedule and the provider offers clear guidance. Beginners should favor clarity and support over advanced features they will not use immediately.`,
    },
    {
      q: `How do I compare options fairly?`,
      a: `Compare options against the same criteria: fit, support, refund terms, update policy, and execution requirements. This prevents biased decisions driven by marketing urgency.`,
    },
    {
      q: `Can I succeed in ${territory.toLowerCase()} with limited time each week?`,
      a: `Yes — if you choose a format built for short sessions and protect a fixed weekly block. Fit matters more than raw hours when time is constrained.`,
    },
  ];

  if (angle === "worth-it") {
    faqs.push({
      q: `Who should skip ${territory.toLowerCase()} entirely?`,
      a: `Skip it if you cannot commit weekly execution time, if your budget is unstable, or if you already have a working system that meets your goals.`,
    });
  }

  const items = faqs.map((item) => `<h3>${item.q}</h3>\n<p>${item.a}</p>`).join("\n");

  return `
<h2 id="frequently-asked-questions">Frequently Asked Questions</h2>
${items}
`.trim();
}

function buildConclusion(territory: string, keyword: string): string {
  return `
<h2 id="conclusion">Conclusion</h2>
<p>Strong outcomes in ${territory.toLowerCase()} come from clear criteria, realistic timelines, and consistent execution — not from chasing every new offer. Use the evaluation framework, avoid the common mistakes, and review your progress on a fixed schedule.</p>
<p>If you remember one takeaway from this ${keyword.toLowerCase()}, make it this: choose fit over hype, then commit long enough to evaluate results fairly.</p>
<p>The buyers who win long-term treat every purchase as a hypothesis — define what success looks like, test the approach, and adjust based on evidence rather than emotion.</p>
`.trim();
}

function buildCta(territory: string): string {
  return `
<div class="cta-box">
<h2 id="next-steps">Next Steps</h2>
<p>Ready to move forward? Apply the checklist above to your shortlist, then start with <a href="#offer">the option we recommend for most readers in ${territory.toLowerCase()}</a>. Keep your first month focused on execution and review — that is where real progress happens.</p>
</div>
`.trim();
}

function padToMinWordCount(html: string, territory: string, keyword: string, minWords: number): string {
  let result = html;
  const extras = [
    `<h3 id="quarterly-review">Quarterly Review Habit</h3><p>Revisit your ${territory.toLowerCase()} plan every 90 days. Markets shift, budgets change, and your goals evolve. A short quarterly review keeps your approach aligned without forcing a full restart.</p>`,
    `<h3 id="tracking-progress">Tracking Progress Without Overwhelm</h3><p>Pick one leading indicator (weekly effort) and one lagging indicator (monthly outcome). That pair balances action with results and keeps ${keyword.toLowerCase()} decisions grounded in data.</p>`,
    `<h3 id="when-to-switch">When to Switch Approaches</h3><p>Switch only after a fair trial — usually 30 days of consistent effort. Premature switching is one of the costliest hidden expenses in ${territory.toLowerCase()}.</p>`,
    `<p>Document lessons learned after each cycle. Your personal playbook becomes more valuable than any single product recommendation over time.</p>`,
  ];
  let i = 0;
  while (countWords(result) < minWords && i < extras.length) {
    result += `\n\n<h2 id="additional-guidance-${i + 1}">Additional Guidance for ${territory}</h2>\n${extras[i]}`;
    i++;
  }
  return result;
}

/** Build a long-form authority article (1,000+ words) for Recurring Stream templates. */
export function buildRecurringStreamArticleContent(params: {
  topic: string;
  territory: string;
  hobby: string;
  angle?: ArticleAngle;
}): GeneratedArticleContent {
  const territory = params.territory.trim() || params.hobby.trim() || "this niche";
  const angle = params.angle ?? "pillar-guide";
  const title = params.topic.trim().slice(0, 120);
  const keyword = primaryKeyword(title, territory);

  const sectionTitles = [
    angle === "best-picks" ? `Best ${territory} Picks by Use Case` : `The Complete ${territory} Overview`,
    `How to Evaluate ${territory} Options`,
    `Practical ${territory} Examples`,
    `${territory} Step-by-Step Checklist`,
    `Common ${territory} Mistakes to Avoid`,
    "Related Reading",
    "Trusted External Resources",
    "Frequently Asked Questions",
    "Conclusion",
    "Next Steps",
  ];

  const intro = buildIntroduction({ title, territory, angle, keyword });
  const featured = featuredImageHtml(territory, title);
  const toc = buildTableOfContents(sectionTitles);
  const main = buildMainSections({ territory, angle, keyword });
  const internalLinks = buildInternalLinksSection(territory);
  const externalLinks = buildExternalResourcesSection(territory);
  const faq = buildFaqSection(territory, angle, keyword);
  const conclusion = buildConclusion(territory, keyword);
  const cta = buildCta(territory);

  let body = [intro, featured, toc, main, internalLinks, externalLinks, faq, conclusion, cta].join("\n\n");
  body = padToMinWordCount(body, territory, keyword, 1200);

  const html = `<article class="${RECURRING_ARTICLE_BODY_CLASS}">\n${body}\n</article>`;
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = countWords(html);

  return {
    title,
    excerpt: plain.slice(0, 200),
    metaDescription: `${title} — expert ${territory.toLowerCase()} guide with buying criteria, FAQs, and practical next steps.`.slice(
      0,
      160
    ),
    html,
    wordCount,
  };
}

/** Wrap article body with SEO H1 for preview/export contexts. */
export function wrapArticleWithTitle(title: string, html: string): string {
  const safeTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (html.includes(`class="${RECURRING_ARTICLE_BODY_CLASS}"`)) {
    return html.replace(
      `<article class="${RECURRING_ARTICLE_BODY_CLASS}">`,
      `<article class="${RECURRING_ARTICLE_BODY_CLASS}">\n<h1>${safeTitle}</h1>`
    );
  }
  return `<article class="${RECURRING_ARTICLE_BODY_CLASS}">\n<h1>${safeTitle}</h1>\n${html}\n</article>`;
}
