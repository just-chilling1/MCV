import type { TemplateStructureId } from "../themes/ready-templates";
import type { ProductSalesCopy } from "./product-sales-copy";

const SECTION_LABELS: Record<
  TemplateStructureId,
  {
    benefits: string;
    faq: string;
    audience: string;
    differentiators: string;
    guarantee: string;
  }
> = {
  editorial: {
    benefits: "What You Get",
    faq: "Common Questions",
    audience: "Is This For You?",
    differentiators: "What Makes It Different",
    guarantee: "Our Recommendation",
  },
  magazine: {
    benefits: "Why People Love It",
    faq: "Quick Answers",
    audience: "Perfect If You…",
    differentiators: "Why It Stands Out",
    guarantee: "The Bottom Line",
  },
  minimal: {
    benefits: "Key Benefits",
    faq: "Questions",
    audience: "Good Fit If…",
    differentiators: "What Sets It Apart",
    guarantee: "Honest Take",
  },
  authority: {
    benefits: "What We Found",
    faq: "Buyer Questions",
    audience: "Who Should Consider This",
    differentiators: "What Sets It Apart",
    guarantee: "Our Verdict",
  },
  conversion: {
    benefits: "Everything You Gain",
    faq: "Got Questions?",
    audience: "Built For People Who…",
    differentiators: "Why Act Now",
    guarantee: "Risk-Free Promise",
  },
  luxury: {
    benefits: "The Experience",
    faq: "Before You Decide",
    audience: "Crafted For",
    differentiators: "Distinctive Qualities",
    guarantee: "Our Assurance",
  },
};

function labelsFor(structureId: TemplateStructureId) {
  return SECTION_LABELS[structureId] ?? SECTION_LABELS.editorial;
}

export interface SalesPageLayoutContext {
  structureId: TemplateStructureId;
  templateName: string;
  productName: string;
  niche: string;
  copy: ProductSalesCopy;
  ctaHref: string;
  escapeHtml: (value: string) => string;
}

export function buildSalesPageBody(ctx: SalesPageLayoutContext): string {
  switch (ctx.structureId) {
    case "magazine":
      return buildMagazineLayout(ctx);
    case "minimal":
      return buildMinimalLayout(ctx);
    case "authority":
      return buildAuthorityLayout(ctx);
    case "conversion":
      return buildConversionLayout(ctx);
    case "luxury":
      return buildLuxuryLayout(ctx);
    case "editorial":
    default:
      return buildEditorialLayout(ctx);
  }
}

function buildEditorialLayout(ctx: SalesPageLayoutContext): string {
  const { copy, productName, niche, ctaHref, escapeHtml: esc } = ctx;
  return `
  <section class="hero hero-editorial">
    <div class="container">
      <div class="badge">${esc(niche)} · Editor's Pick</div>
      <h1><span class="hero-accent">${esc(copy.hook)}</span></h1>
      <p class="hero-sub">${esc(copy.subhook)}</p>
      <a href="${ctaHref}" class="cta">Explore This Offer <span>→</span></a>
    </div>
  </section>
  <section>
    <div class="container layout-narrow">
      <span class="label">The Problem</span>
      <h2 class="title">${esc(copy.problemHeadline)}</h2>
      <div class="problem-list">${copy.problemPoints.map((p) => `<div class="problem-item"><span>✕</span><span>${esc(p)}</span></div>`).join("")}</div>
      <div class="agitation">${esc(copy.agitation)}</div>
    </div>
  </section>
  <section class="alt">
    <div class="container layout-narrow center">
      <span class="label">The Truth</span>
      <h2 class="title">A Different Perspective</h2>
      <p class="subtitle">${esc(copy.newPerspective)}</p>
      <p class="accent-text pull-quote">${esc(copy.ahaMoment)}</p>
    </div>
  </section>
  <section>
    <div class="container layout-narrow center">
      <span class="label">The Solution</span>
      <h2 class="title">${productName}</h2>
      <p class="subtitle">${esc(copy.productIntro)}</p>
    </div>
  </section>
  ${benefitsSection(copy, esc, ctx.structureId, "benefits-grid")}
  ${differentiatorsSection(copy, esc, ctx.structureId)}
  ${audienceSection(copy, esc, ctx.structureId)}
  ${contentsSection(copy, esc, "Everything Included")}
  ${faqSection(copy, esc, ctx.structureId)}
  ${guaranteeSection(copy, esc, ctx.structureId)}
  ${finalSection(copy, ctaHref, esc, "Ready to Take the Next Step?")}
  ${mobileCtaBar(copy, ctaHref, esc)}
  ${footerSection(productName, esc)}`;
}

function buildMagazineLayout(ctx: SalesPageLayoutContext): string {
  const { copy, productName, niche, ctaHref, escapeHtml: esc } = ctx;
  return `
  <section class="hero hero-magazine">
    <div class="container">
      <div class="badge badge-hot">Trending in ${esc(niche)}</div>
      <h1 class="title-magazine">${esc(copy.hook)}</h1>
      <p class="hero-sub">${esc(copy.subhook)}</p>
      <a href="${ctaHref}" class="cta cta-wide">See Why Everyone's Talking →</a>
    </div>
  </section>
  <section class="alt">
    <div class="container">
      <div class="bento-grid">
        ${copy.benefits
          .map(
            (b, i) => `<div class="card card-bento benefit-card">
        <span class="benefit-index">${String(i + 1).padStart(2, "0")}</span>
        <h3>${esc(b.title)}</h3>
        <p>${esc(b.description)}</p>
      </div>`
          )
          .join("")}
      </div>
    </div>
  </section>
  <section>
    <div class="container">
      <span class="label">Reality Check</span>
      <h2 class="title">${esc(copy.problemHeadline)}</h2>
      <div class="split">${copy.problemPoints.slice(0, 4).map((p) => `<div class="problem-item"><span>!</span><span>${esc(p)}</span></div>`).join("")}</div>
    </div>
  </section>
  <section class="alt">
    <div class="container center">
      <h2 class="title">${productName}</h2>
      <p class="subtitle">${esc(copy.productIntro)}</p>
      <p class="accent-text" style="font-size:1.15rem;font-weight:700;">${esc(copy.ahaMoment)}</p>
    </div>
  </section>
  ${differentiatorsSection(copy, esc, ctx.structureId, "Why It Stands Out")}
  ${audienceSection(copy, esc, ctx.structureId)}
  ${contentsSection(copy, esc, "What's Inside")}
  ${faqSection(copy, esc, ctx.structureId, "grid-2")}
  ${guaranteeSection(copy, esc, ctx.structureId)}
  ${finalSection(copy, ctaHref, esc, "Don't Wait — Check It Out")}
  ${mobileCtaBar(copy, ctaHref, esc)}
  ${footerSection(productName, esc)}`;
}

function buildMinimalLayout(ctx: SalesPageLayoutContext): string {
  const { copy, productName, niche, ctaHref, escapeHtml: esc } = ctx;
  return `
  <section class="hero hero-minimal">
    <div class="container layout-minimal">
      <p class="label">${esc(niche)}</p>
      <h1 class="title title-minimal">${esc(copy.hook)}</h1>
      <p class="hero-sub">${esc(copy.subhook)}</p>
      <a href="${ctaHref}" class="cta cta-minimal">View offer →</a>
    </div>
  </section>
  <section>
    <div class="container layout-minimal">
      <h2 class="title">${esc(copy.problemHeadline)}</h2>
      <ul class="list list-minimal">${copy.problemPoints.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      <p class="subtitle" style="margin-top:24px;">${esc(copy.newPerspective)}</p>
    </div>
  </section>
  <section class="alt">
    <div class="container layout-minimal">
      <h2 class="title">${productName}</h2>
      <p class="subtitle">${esc(copy.productIntro)}</p>
      <div class="stack-list">${copy.benefits.map((b) => `<div class="stack-item"><strong>${esc(b.title)}</strong><span>${esc(b.description)}</span></div>`).join("")}</div>
    </div>
  </section>
  <section>
    <div class="container layout-minimal">
      <h2 class="title">Good fit if…</h2>
      <ul class="list list-minimal">${copy.forWho.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
    </div>
  </section>
  ${faqSection(copy, esc, ctx.structureId)}
  ${guaranteeSection(copy, esc, ctx.structureId, "layout-minimal")}
  ${finalSection(copy, ctaHref, esc, "Learn more", "layout-minimal")}
  ${mobileCtaBar(copy, ctaHref, esc, "View offer →")}
  ${footerSection(productName, esc)}`;
}

function buildAuthorityLayout(ctx: SalesPageLayoutContext): string {
  const { copy, productName, niche, ctaHref, escapeHtml: esc } = ctx;
  return `
  <section class="hero hero-authority">
    <div class="container">
      <div class="trust-row">
        <span class="trust-badge">Reviewed</span>
        <span class="trust-badge">${esc(niche)}</span>
        <span class="trust-badge">Updated ${new Date().getFullYear()}</span>
      </div>
      <h1 class="title">${esc(copy.hook)}</h1>
      <p class="hero-sub">${esc(copy.subhook)}</p>
      <a href="${ctaHref}" class="cta">Read Our Recommendation →</a>
    </div>
  </section>
  <section class="alt">
    <div class="container split">
      <div>
        <span class="label">The Issue</span>
        <h2 class="title">${esc(copy.problemHeadline)}</h2>
        <ul class="list">${copy.problemPoints.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </div>
      <div>
        <span class="label">Our Take</span>
        <p class="subtitle">${esc(copy.newPerspective)}</p>
        <p class="accent-text" style="font-weight:600;">${esc(copy.ahaMoment)}</p>
      </div>
    </div>
  </section>
  <section>
    <div class="container">
      <span class="label">Product Review</span>
      <h2 class="title">${productName}</h2>
      <p class="subtitle">${esc(copy.productIntro)}</p>
      <div class="numbered-list">${copy.benefits.map((b, i) => `<div class="numbered-item"><span class="num">${i + 1}</span><div><h3>${esc(b.title)}</h3><p>${esc(b.description)}</p></div></div>`).join("")}</div>
    </div>
  </section>
  ${differentiatorsSection(copy, esc, ctx.structureId, "What Sets It Apart")}
  ${audienceSection(copy, esc, ctx.structureId)}
  ${contentsSection(copy, esc, "Review Coverage")}
  ${faqSection(copy, esc, ctx.structureId)}
  ${guaranteeSection(copy, esc, ctx.structureId)}
  ${finalSection(copy, ctaHref, esc, "See the Offer We Recommend")}
  ${mobileCtaBar(copy, ctaHref, esc, "See offer →")}
  ${footerSection(productName, esc)}`;
}

function buildConversionLayout(ctx: SalesPageLayoutContext): string {
  const { copy, productName, niche, ctaHref, escapeHtml: esc } = ctx;
  return `
  <section class="hero hero-conversion">
    <div class="container center">
      <div class="badge badge-urgent">Limited-Time Offer · ${esc(niche)}</div>
      <h1><span class="hero-accent">${esc(copy.hook)}</span></h1>
      <p class="hero-sub">${esc(copy.subhook)}</p>
      <div class="cta-row">
        <a href="${ctaHref}" class="cta cta-large">Get Instant Access →</a>
      </div>
      <p class="template-tag">${esc(copy.urgency)}</p>
    </div>
  </section>
  <section class="strip-section">
    <div class="container strip-list">${copy.problemPoints.map((p) => `<span>${esc(p)}</span>`).join("")}</div>
  </section>
  <section class="alt">
    <div class="container center">
      <p class="agitation agitation-center">${esc(copy.agitation)}</p>
      <p class="accent-text" style="font-size:1.2rem;font-weight:700;margin-top:20px;">${esc(copy.ahaMoment)}</p>
    </div>
  </section>
  <section>
    <div class="container center">
      <h2 class="title">${productName}</h2>
      <p class="subtitle">${esc(copy.productIntro)}</p>
    </div>
  </section>
  ${benefitsSection(copy, esc, ctx.structureId, "benefits-grid benefits-grid-3")}
  ${contentsSection(copy, esc, "You Get Everything")}
  ${audienceSection(copy, esc, ctx.structureId)}
  ${faqSection(copy, esc, ctx.structureId)}
  ${guaranteeSection(copy, esc, ctx.structureId)}
  ${finalSection(copy, ctaHref, esc, "Claim Your Access Now")}
  ${mobileCtaBar(copy, ctaHref, esc, "Get Access →")}
  ${footerSection(productName, esc)}`;
}

function buildLuxuryLayout(ctx: SalesPageLayoutContext): string {
  const { copy, productName, niche, ctaHref, escapeHtml: esc } = ctx;
  return `
  <section class="hero hero-luxury">
    <div class="container layout-narrow center">
      <p class="label label-luxury">${esc(niche)} · Curated Selection</p>
      <h1 class="title title-luxury">${esc(copy.hook)}</h1>
      <p class="hero-sub hero-sub-luxury">${esc(copy.subhook)}</p>
      <a href="${ctaHref}" class="cta cta-luxury">Discover ${esc(productName)}</a>
    </div>
  </section>
  <section class="alt">
    <div class="container layout-narrow center">
      <p class="subtitle">${esc(copy.newPerspective)}</p>
      <div class="divider"></div>
      <p class="pull-quote pull-quote-luxury">${esc(copy.ahaMoment)}</p>
    </div>
  </section>
  <section>
    <div class="container layout-narrow">
      <h2 class="title title-luxury">${productName}</h2>
      <p class="subtitle">${esc(copy.productIntro)}</p>
      <div class="luxury-columns">${copy.benefits.map((b) => `<div class="luxury-item"><h3>${esc(b.title)}</h3><p>${esc(b.description)}</p></div>`).join("")}</div>
    </div>
  </section>
  <section class="alt">
    <div class="container layout-narrow">
      <span class="label">Considerations</span>
      <p class="subtitle">${esc(copy.problemHeadline)}</p>
      <ul class="list list-luxury">${copy.problemPoints.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </div>
  </section>
  ${differentiatorsSection(copy, esc, ctx.structureId, "Distinctive Qualities")}
  ${audienceSection(copy, esc, ctx.structureId, "layout-narrow")}
  ${contentsSection(copy, esc, "The Experience Includes", "layout-narrow")}
  ${faqSection(copy, esc, ctx.structureId, undefined, "layout-narrow")}
  ${guaranteeSection(copy, esc, ctx.structureId, "layout-narrow guarantee-luxury")}
  ${finalSection(copy, ctaHref, esc, "Begin Your Transformation", "layout-narrow")}
  ${mobileCtaBar(copy, ctaHref, esc, "Discover →")}
  ${footerSection(productName, esc)}`;
}

function benefitsSection(
  copy: ProductSalesCopy,
  esc: (v: string) => string,
  structureId: TemplateStructureId,
  gridClass = "benefits-grid"
) {
  const labels = labelsFor(structureId);
  return `
  <section class="alt benefits-section">
    <div class="container">
      <div class="center benefits-header">
        <span class="label">Benefits</span>
        <h2 class="title">${labels.benefits}</h2>
      </div>
      <div class="${gridClass}">${copy.benefits
        .map(
          (b, i) => `<div class="card benefit-card">
        <span class="benefit-index">${String(i + 1).padStart(2, "0")}</span>
        <h3>${esc(b.title)}</h3>
        <p>${esc(b.description)}</p>
      </div>`
        )
        .join("")}</div>
    </div>
  </section>`;
}

function differentiatorsSection(
  copy: ProductSalesCopy,
  esc: (v: string) => string,
  structureId: TemplateStructureId,
  title?: string
) {
  const labels = labelsFor(structureId);
  return `
  <section>
    <div class="container center">
      <span class="label">Differentiators</span>
      <h2 class="title">${title ?? labels.differentiators}</h2>
      <div class="contents" style="margin-top:28px;max-width:720px;margin-left:auto;margin-right:auto;">${copy.differentiators.map((d) => `<div class="content-item"><span class="accent-text">★</span><span>${esc(d)}</span></div>`).join("")}</div>
    </div>
  </section>`;
}

function audienceSection(
  copy: ProductSalesCopy,
  esc: (v: string) => string,
  structureId: TemplateStructureId,
  containerClass = ""
) {
  const labels = labelsFor(structureId);
  return `
  <section class="alt">
    <div class="container ${containerClass}">
      <div class="center"><span class="label">Fit</span><h2 class="title">${labels.audience}</h2></div>
      <div class="split" style="margin-top:32px;">
        <div><h3 class="accent-text" style="margin-bottom:16px;">This IS for you if…</h3><ul class="list">${copy.forWho.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>
        <div><h3 style="margin-bottom:16px;">Not for you if…</h3><ul class="list">${copy.notForWho.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>
      </div>
    </div>
  </section>`;
}

function contentsSection(copy: ProductSalesCopy, esc: (v: string) => string, title: string, containerClass = "") {
  return `
  <section>
    <div class="container ${containerClass} center">
      <span class="label">Included</span>
      <h2 class="title">${title}</h2>
      <div class="contents" style="margin-top:28px;">${copy.contents.map((c) => `<div class="content-item"><span class="accent-text">✓</span><span>${esc(c)}</span></div>`).join("")}</div>
    </div>
  </section>`;
}

function faqSection(
  copy: ProductSalesCopy,
  esc: (v: string) => string,
  structureId: TemplateStructureId,
  layoutClass?: string,
  containerClass = ""
) {
  const labels = labelsFor(structureId);
  const listClass = layoutClass === "grid-2" ? "faq-list faq-grid-2" : "faq-list";
  return `
  <section class="alt">
    <div class="container ${containerClass}">
      <div class="center"><span class="label">FAQ</span><h2 class="title">${labels.faq}</h2></div>
      <div class="${listClass}" style="margin-top:32px;">${copy.faqs.map((f) => `<div class="faq"><div class="faq-q">${esc(f.question)}</div><div class="faq-a">${esc(f.answer)}</div></div>`).join("")}</div>
    </div>
  </section>`;
}

function guaranteeSection(
  copy: ProductSalesCopy,
  esc: (v: string) => string,
  structureId: TemplateStructureId,
  extraClass = ""
) {
  const labels = labelsFor(structureId);
  return `
  <section>
    <div class="container">
      <div class="guarantee ${extraClass}">
        <h3 class="title" style="font-size:1.5rem;">${labels.guarantee}</h3>
        <p class="subtitle" style="margin:0 auto;">${esc(copy.guarantee)}</p>
      </div>
    </div>
  </section>`;
}

function finalSection(
  copy: ProductSalesCopy,
  ctaHref: string,
  esc: (v: string) => string,
  title: string,
  containerClass = ""
) {
  return `
  <section class="final" id="buy">
    <div class="container ${containerClass} center">
      <h2 class="title">${title}</h2>
      <p class="subtitle">${esc(copy.finalCta)}</p>
      <a href="${ctaHref}" class="cta">View the Offer →</a>
      <p class="subtitle" style="margin-top:24px;font-size:0.95rem;">${esc(copy.urgency)}</p>
    </div>
  </section>`;
}

function mobileCtaBar(
  _copy: ProductSalesCopy,
  ctaHref: string,
  esc: (v: string) => string,
  label = "View Offer →"
) {
  return `
  <div class="mobile-cta-bar">
    <a href="${ctaHref}" class="cta cta-mobile">${esc(label)}</a>
  </div>`;
}

function footerSection(productName: string, esc: (v: string) => string) {
  return `<footer><div class="container"><p>&copy; ${new Date().getFullYear()} ${productName}. All rights reserved.</p></div></footer>`;
}

export function structureLayoutCss(structureId: TemplateStructureId): string {
  switch (structureId) {
    case "magazine":
      return `
    .product-sales-page-root .hero-magazine { min-height: clamp(380px, 68vh, 680px); text-align: left; }
    .product-sales-page-root .title-magazine { font-size: clamp(2.4rem, 7vw, 4.5rem); line-height: 1; }
    .product-sales-page-root .badge-hot { background: color-mix(in srgb, var(--accent) 22%, #000); }
    .product-sales-page-root .bento-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; }
    .product-sales-page-root .card-bento { min-height: 160px; }
    .product-sales-page-root .card-bento h3 { color: var(--card-text); font-size: 1.05rem; margin-bottom: 8px; }
    .product-sales-page-root .card-bento p { color: var(--card-muted); font-size: 0.92rem; line-height: 1.55; }
    .product-sales-page-root .cta-wide { width: 100%; max-width: 420px; justify-content: center; }`;
    case "minimal":
      return `
    .product-sales-page-root .container.layout-minimal { max-width: 640px; }
    .product-sales-page-root .hero-minimal { min-height: clamp(320px, 52vh, 520px); text-align: left; padding-top: 64px; }
    .product-sales-page-root .title-minimal { font-size: clamp(2rem, 5vw, 3rem); font-weight: 600; }
    .product-sales-page-root .cta-minimal { background: var(--accent); box-shadow: none; border-radius: 8px; padding: 14px 28px; }
    .product-sales-page-root .list-minimal li { background: transparent; border: none; border-bottom: 1px solid var(--border); border-radius: 0; padding: 12px 0; }
    .product-sales-page-root .stack-list { display: grid; gap: 20px; margin-top: 28px; }
    .product-sales-page-root .stack-item { display: grid; gap: 6px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
    .product-sales-page-root .stack-item strong { color: var(--card-text); font-size: 1rem; }
    .product-sales-page-root .stack-item span { color: var(--card-muted); font-size: 0.95rem; }`;
    case "authority":
      return `
    .product-sales-page-root .hero-authority { text-align: left; min-height: clamp(360px, 65vh, 640px); }
    .product-sales-page-root .trust-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
    .product-sales-page-root .trust-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 12px; border-radius: 999px; border: 1px solid var(--border); color: var(--label); }
    .product-sales-page-root .numbered-list { display: grid; gap: 16px; margin-top: 28px; }
    .product-sales-page-root .numbered-item { display: flex; gap: 16px; padding: 20px; background: var(--elevated); color: var(--card-text); border-radius: 14px; border: 1px solid var(--border); }
    .product-sales-page-root .numbered-item .num { font-weight: 800; color: var(--label); font-size: 1.25rem; }
    .product-sales-page-root .numbered-item h3 { font-size: 1rem; margin-bottom: 6px; color: var(--card-text); }
    .product-sales-page-root .numbered-item p { color: var(--card-muted); font-size: 0.92rem; }`;
    case "conversion":
      return `
    .product-sales-page-root .hero-conversion { min-height: clamp(400px, 70vh, 720px); }
    .product-sales-page-root .badge-urgent { animation: pulse 2s infinite; }
    .product-sales-page-root .cta-large { padding: 22px 48px; font-size: 1.1rem; }
    .product-sales-page-root .cta-row { display: flex; justify-content: center; margin-top: 8px; }
    .product-sales-page-root .strip-section { padding: 32px 24px; background: var(--surface); border-block: 1px solid var(--border); }
    .product-sales-page-root .strip-list { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .product-sales-page-root .strip-list span { padding: 10px 16px; border-radius: 999px; background: var(--elevated); color: var(--card-text); font-size: 0.88rem; border: 1px solid var(--border); }
    .product-sales-page-root .agitation-center { font-style: normal; text-align: center; border-left: none; border-radius: 14px; max-width: 720px; margin: 0 auto; }
    .product-sales-page-root .faq-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; max-width: none; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.75; } }`;
    case "luxury":
      return `
    .product-sales-page-root .hero-luxury { min-height: clamp(380px, 68vh, 680px); }
    .product-sales-page-root .title-luxury { font-weight: 600; letter-spacing: -0.02em; }
    .product-sales-page-root .label-luxury { letter-spacing: 0.3em; }
    .product-sales-page-root .hero-sub-luxury { font-size: 1.2rem; line-height: 1.8; }
    .product-sales-page-root .cta-luxury { border-radius: 999px; padding: 16px 36px; letter-spacing: 0.04em; }
    .product-sales-page-root .divider { width: 64px; height: 1px; background: var(--label); margin: 28px auto; opacity: 0.5; }
    .product-sales-page-root .pull-quote-luxury { font-family: var(--heading-font); font-size: 1.35rem; line-height: 1.6; font-style: italic; }
    .product-sales-page-root .luxury-columns { display: grid; gap: 0; margin-top: 36px; border-top: 1px solid var(--border); }
    .product-sales-page-root .luxury-item { padding: 28px 0; border-bottom: 1px solid var(--border); }
    .product-sales-page-root .luxury-item h3 { font-family: var(--heading-font); margin-bottom: 8px; color: var(--text); }
    .product-sales-page-root .luxury-item p { color: var(--muted); }
    .product-sales-page-root .list-luxury li { background: transparent; border: none; padding: 10px 0; }
    .product-sales-page-root .guarantee-luxury { border-radius: 4px; }`;
    case "editorial":
    default:
      return `
    .product-sales-page-root .container.layout-narrow { max-width: 760px; }
    .product-sales-page-root .hero-editorial { min-height: clamp(400px, 70vh, 720px); }
    .product-sales-page-root .pull-quote { font-family: var(--heading-font); font-size: 1.25rem; line-height: 1.55; max-width: 620px; margin: 0 auto; }`;
  }
}
