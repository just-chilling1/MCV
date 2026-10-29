import { generateStructuredJSON, extractJsonFromText, generateWithGPT } from "./ai";
import type { TemplateStructureId } from "../themes/ready-templates";

export interface ProductSalesCopy {
  hook: string;
  subhook: string;
  problemHeadline: string;
  problemPoints: string[];
  agitation: string;
  newPerspective: string;
  ahaMoment: string;
  productIntro: string;
  benefits: { title: string; description: string }[];
  differentiators: string[];
  forWho: string[];
  notForWho: string[];
  faqs: { question: string; answer: string }[];
  guarantee: string;
  contents: string[];
  finalCta: string;
  urgency: string;
}

const SALES_COPY_SYSTEM_BASE = `You are an elite copywriter specializing in affiliate product promotion pages.
Return ONLY valid JSON with these keys:
hook, subhook, problemHeadline, problemPoints (array of 4 strings), agitation, newPerspective, ahaMoment,
productIntro, benefits (array of 6 {title, description}), differentiators (array of 4 strings),
forWho (array of 4 strings), notForWho (array of 3 strings), faqs (array of 5 {question, answer}),
guarantee, contents (array of 8 strings), finalCta, urgency.

Write persuasive, niche-specific copy grounded in the scraped offer context when provided.
Do not invent fake brand names, fake testimonials, or fake pricing.
The "contents" array must list real deliverables, modules, or features of the OFFER being promoted — never meta-features about the landing page (no "mobile-friendly design", "affiliate link on CTA", "responsive layout", etc.).
Each benefit must describe a concrete outcome for the buyer, not a generic marketing claim.`;

const COPY_TONE_INSTRUCTIONS: Record<TemplateStructureId, string> = {
  editorial: `VOICE: Thoughtful editorial — like a trusted magazine feature. Story-driven, empathetic, complete sentences, narrative flow. Headlines sound like article titles, not ads. Avoid hype and ALL CAPS.`,
  magazine: `VOICE: Bold magazine energy — punchy headlines, short sentences (often under 12 words), vivid verbs, cover-line urgency. Feel like a lifestyle publication recommending a must-have.`,
  minimal: `VOICE: Calm and precise — understated, respectful, zero hype. Clear facts, plain language, no exclamation marks, no fake urgency. Sound like a knowledgeable friend giving honest advice.`,
  authority: `VOICE: Expert reviewer — analytical, evidence-leaning, comparison-minded. Use phrases like "our take", "what stands out", "worth considering". Build trust through specificity, not pressure.`,
  conversion: `VOICE: Direct-response sales — bold hooks, pain amplification, urgency, action CTAs. Classic high-converting affiliate page energy. Short punchy paragraphs. Create momentum toward clicking.`,
  luxury: `VOICE: Premium aspirational — refined vocabulary, transformation-focused, exclusivity without clichés. Elegant, confident, spa-brand tone. Avoid cheap urgency or bargain language.`,
};

export function getCopyToneInstruction(copyToneId: TemplateStructureId): string {
  return COPY_TONE_INSTRUCTIONS[copyToneId] ?? COPY_TONE_INSTRUCTIONS.editorial;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function validateSalesCopy(raw: unknown): ProductSalesCopy | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const benefitsRaw = Array.isArray(data.benefits) ? data.benefits : [];
  const benefits = benefitsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const b = item as Record<string, unknown>;
      const title = asString(b.title);
      const description = asString(b.description);
      if (!title || !description) return null;
      return { title, description };
    })
    .filter(Boolean) as { title: string; description: string }[];

  const faqsRaw = Array.isArray(data.faqs) ? data.faqs : [];
  const faqs = faqsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const f = item as Record<string, unknown>;
      const question = asString(f.question);
      const answer = asString(f.answer);
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter(Boolean) as { question: string; answer: string }[];

  const hook = asString(data.hook);
  const subhook = asString(data.subhook);
  if (!hook || benefits.length < 3 || faqs.length < 3) return null;

  return {
    hook,
    subhook,
    problemHeadline: asString(data.problemHeadline, "Sound familiar?"),
    problemPoints: asStringArray(data.problemPoints, []),
    agitation: asString(data.agitation),
    newPerspective: asString(data.newPerspective),
    ahaMoment: asString(data.ahaMoment),
    productIntro: asString(data.productIntro),
    benefits,
    differentiators: asStringArray(data.differentiators, []),
    forWho: asStringArray(data.forWho, []),
    notForWho: asStringArray(data.notForWho, []),
    faqs,
    guarantee: asString(
      data.guarantee,
      "100% Satisfaction Guarantee — try it risk-free with a full refund if you're not happy."
    ),
    contents: asStringArray(data.contents, []),
    finalCta: asString(data.finalCta, "Take the first step toward the results you deserve."),
    urgency: asString(data.urgency, "Every day you wait is another day of unnecessary struggle."),
  };
}

export function buildFallbackSalesCopy(input: {
  productName: string;
  niche: string;
  description?: string;
}): ProductSalesCopy {
  const topic = input.niche.toLowerCase();
  const productName = input.productName;

  return {
    hook: `What if everything you knew about ${topic} was holding you back?`,
    subhook: `Discover the proven approach that's helping people in ${input.niche} finally get real results.`,
    problemHeadline: `Still struggling with ${topic}?`,
    problemPoints: [
      "You've tried multiple approaches but nothing creates lasting change",
      "You're overwhelmed by conflicting advice online",
      "You feel like time is running out and nothing is working",
      "You watch others succeed while you keep hitting the same walls",
    ],
    agitation: `Every passing day, the frustration builds. You've invested time and money into solutions that promised transformation but delivered disappointment. The worst part? You're starting to wonder if real change is even possible.`,
    newPerspective: `Here's what nobody tells you: it's not your fault. Most advice about ${topic} is generic and wasn't built for your situation.`,
    ahaMoment: `What if you focused on one proven product and system instead of chasing random tips that never connect?`,
    productIntro: `Introducing ${productName} — a focused solution for ${input.niche} that shows you exactly what works, step by step.${input.description ? ` ${input.description}` : ""}`,
    benefits: [
      {
        title: "Clear Action Plan",
        description: "Know exactly what to do first — no guesswork or information overload.",
      },
      {
        title: "Niche-Tailored",
        description: `Built specifically for people interested in ${input.niche}.`,
      },
      {
        title: "Fast to Start",
        description: "Begin implementing today — no complicated setup required.",
      },
      {
        title: "Proven Framework",
        description: "Based on strategies that convert browsers into buyers in this niche.",
      },
      {
        title: "Beginner Friendly",
        description: "Plain language with zero jargon — anyone can follow along.",
      },
      {
        title: "Results-Focused",
        description: "Every section drives toward one outcome: helping you promote and profit.",
      },
    ],
    differentiators: [
      "Laser-focused on your niche — not generic fluff",
      "Designed to promote a real product you can stand behind",
      "Conversion-ready layout that guides visitors to take action",
      "Professional presentation that builds instant trust",
    ],
    forWho: [
      "You're ready to promote a product in this niche seriously",
      "You want a professional page without hiring a designer",
      "You're willing to follow a proven path instead of guessing",
      "You value your time and want the fastest route to launch",
    ],
    notForWho: [
      "You're looking for a magic button with zero effort",
      "You're not willing to share a genuine recommendation",
      "You already have a high-converting page you're happy with",
    ],
    faqs: [
      {
        question: "Is this relevant to my niche?",
        answer: `Yes — this page is built specifically around ${input.niche} and the product you're promoting.`,
      },
      {
        question: "How quickly can I start getting traffic?",
        answer: "As soon as your page is live, you can share your link on social media, email, or ads.",
      },
      {
        question: "Do I need technical skills?",
        answer: "No. Your page is generated and hosted for you — just share the link.",
      },
      {
        question: "What if the product isn't for me?",
        answer: "You can edit your link and regenerate anytime from your dashboard.",
      },
      {
        question: "Is my affiliate link included?",
        answer: "Yes — every call-to-action on your page routes visitors to your affiliate offer.",
      },
    ],
    guarantee:
      "100% Satisfaction Guarantee. Explore the offer risk-free — if it's not the right fit, you're protected.",
    contents: [
      "Core training or system for getting results in this niche",
      "Step-by-step implementation guidance",
      "Tools, templates, or resources included with the offer",
      "Support, community, or onboarding access (if applicable)",
      "Bonus materials or fast-start modules",
      "Updates or ongoing access terms",
      "Refund or guarantee terms from the vendor",
      "Clear next steps after purchase",
    ],
    finalCta:
      "You've read this far because something resonated. Trust that instinct and check out the offer today.",
    urgency:
      "The best time to start was yesterday. The second best time is right now — your audience is already searching.",
  };
}

export async function generateProductSalesCopy(input: {
  productName: string;
  niche: string;
  description?: string;
  productContext?: string;
  affiliateLabel?: string;
  copyToneId?: TemplateStructureId;
}): Promise<ProductSalesCopy> {
  const toneInstruction = getCopyToneInstruction(input.copyToneId ?? "editorial");
  const systemPrompt = `${SALES_COPY_SYSTEM_BASE}\n\n${toneInstruction}`;

  const userPrompt = `Create sales page copy to promote this product in the "${input.niche}" niche.

PRODUCT NAME: ${input.productName}
NICHE: ${input.niche}
AFFILIATE OFFER LABEL: ${input.affiliateLabel || input.productName}
DESCRIPTION: ${input.description || "A proven solution for this niche."}
${input.productContext ? `\nSCRAPED OFFER CONTEXT:\n${input.productContext}` : ""}

Position this as a valuable product recommendation page — not a fake ebook. Focus on why this offer helps people in ${input.niche}. Use scraped context for specific product details, outcomes, and deliverables. Match the voice instruction exactly.`;

  try {
    return await generateStructuredJSON({
      systemPrompt,
      userPrompt,
      validate: validateSalesCopy,
      options: { temperature: 0.65, maxRetries: 2, maxRepairAttempts: 1 },
    });
  } catch {
    try {
      const raw = await generateWithGPT(systemPrompt, userPrompt, {
        temperature: 0.75,
        maxRetries: 2,
      });
      const parsed = validateSalesCopy(extractJsonFromText(raw));
      if (parsed) return parsed;
    } catch {
      /* use fallback */
    }
    return buildFallbackSalesCopy(input);
  }
}

export function deriveProductName(input: {
  niche: string;
  scrapedTitle?: string;
  affiliateLabel?: string;
}): string {
  const scraped = input.scrapedTitle?.trim();
  if (scraped && scraped.length > 3 && scraped.length < 120) return scraped;
  const label = input.affiliateLabel?.trim();
  if (label && label.length > 3) return label;
  return `The Complete ${input.niche} Solution`;
}
