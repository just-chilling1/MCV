import { generateStructuredJSON, extractJsonFromText, generateWithGPT } from "./ai";
import type { TemplateStructureId } from "../themes/ready-templates";
import {
  buildQuestionnairePromptContext,
  buildSeededQuestionnaireCopy,
  resolveNicheKey,
  type NicheKey,
} from "./questionnaire-seeds";

export interface QuestionnaireQuestion {
  id: string;
  question: string;
  options: { label: string; value: string }[];
}

export interface QuestionnaireCopy {
  title: string;
  subtitle: string;
  intro: string;
  questions: QuestionnaireQuestion[];
  resultHeadline: string;
  resultMessage: string;
  promoHeadline: string;
  promoBody: string;
  promoBullets: string[];
  promoCta: string;
  promoSubtext: string;
}

const QUESTIONNAIRE_SYSTEM_BASE = `You are an expert quiz funnel copywriter.
Return ONLY valid JSON with these keys:
title, subtitle, intro, questions (array of 5-6 items with id, question, options),
resultHeadline, resultMessage, promoHeadline, promoBody, promoBullets (array of 3 strings),
promoCta, promoSubtext.

Each question must have exactly 4 options with label and value fields.
Questions must be about the NICHE topic — goals, habits, challenges, preferences — NOT about the affiliate product.
The affiliate product is revealed ONLY on the final promo page after the quiz.
Do not mention the product name in questions. Keep language friendly and conversational.`;

const COPY_TONE_INSTRUCTIONS: Record<TemplateStructureId, string> = {
  editorial: `VOICE: Thoughtful editorial — empathetic, story-driven, complete sentences.`,
  magazine: `VOICE: Bold magazine energy — punchy questions, vivid language, energetic.`,
  minimal: `VOICE: Calm and precise — plain language, zero hype, respectful.`,
  authority: `VOICE: Expert guide — analytical, trust-building, specific.`,
  conversion: `VOICE: Direct-response — bold hooks, urgency on the promo page only.`,
  luxury: `VOICE: Premium aspirational — refined, transformation-focused.`,
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function validateQuestionnaireCopy(raw: unknown): QuestionnaireCopy | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  const questionsRaw = Array.isArray(data.questions) ? data.questions : [];
  const questions: QuestionnaireQuestion[] = [];

  for (let i = 0; i < questionsRaw.length; i++) {
    const item = questionsRaw[i];
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;
    const question = asString(q.question);
    const id = asString(q.id, `q${i + 1}`);
    const optionsRaw = Array.isArray(q.options) ? q.options : [];
    const options = optionsRaw
      .map((opt, j) => {
        if (!opt || typeof opt !== "object") return null;
        const o = opt as Record<string, unknown>;
        const label = asString(o.label);
        const value = asString(o.value, `opt${j + 1}`);
        if (!label) return null;
        return { label, value };
      })
      .filter(Boolean) as { label: string; value: string }[];

    if (question && options.length >= 3) {
      questions.push({ id, question, options });
    }
  }

  const title = asString(data.title);
  const subtitle = asString(data.subtitle);
  if (!title || questions.length < 4) return null;

  return {
    title,
    subtitle,
    intro: asString(data.intro, "Answer a few quick questions to get personalized insights."),
    questions,
    resultHeadline: asString(data.resultHeadline, "Your personalized results are ready"),
    resultMessage: asString(
      data.resultMessage,
      "Based on your answers, we found something that could help you move forward."
    ),
    promoHeadline: asString(data.promoHeadline, "Recommended for you"),
    promoBody: asString(data.promoBody),
    promoBullets: asStringArray(data.promoBullets, []),
    promoCta: asString(data.promoCta, "See the recommended offer"),
    promoSubtext: asString(data.promoSubtext, "Tap below to learn more — no obligation."),
  };
}

export function buildFallbackQuestionnaireCopy(input: {
  niche: string;
  nicheKey?: NicheKey;
  productName: string;
  description?: string;
  copyToneId?: TemplateStructureId;
}): QuestionnaireCopy {
  return buildSeededQuestionnaireCopy(input);
}

export async function generateQuestionnaireCopy(input: {
  niche: string;
  nicheKey?: NicheKey;
  productName: string;
  description?: string;
  productContext?: string;
  affiliateLabel?: string;
  copyToneId?: TemplateStructureId;
  templateId?: string;
  templateName?: string;
}): Promise<QuestionnaireCopy> {
  const nicheKey = input.nicheKey ?? resolveNicheKey(input.niche);
  const copyToneId = input.copyToneId ?? "editorial";
  const toneInstruction = COPY_TONE_INSTRUCTIONS[copyToneId];
  const promptContext = buildQuestionnairePromptContext({
    niche: input.niche,
    nicheKey,
    copyToneId,
    templateName: input.templateName,
  });
  const systemPrompt = `${QUESTIONNAIRE_SYSTEM_BASE}\n\n${toneInstruction}\n\nEach quiz must use questions unique to the niche and template — never generic copy that works for any topic.`;

  const userPrompt = `Create a niche questionnaire funnel for "${input.niche}".

${promptContext}

PRODUCT NAME (for final promo page only): ${input.productName}
AFFILIATE OFFER LABEL: ${input.affiliateLabel || input.productName}
DESCRIPTION: ${input.description || "A proven solution for this niche."}
${input.productContext ? `\nSCRAPED OFFER CONTEXT (use on promo page only):\n${input.productContext}` : ""}

Write original questions in the same niche-specific style as the examples above.
The final promo page recommends the product as a natural next step based on quiz results.
Match the template voice exactly — editorial vs conversion vs minimal must feel distinctly different.`;

  try {
    return await generateStructuredJSON({
      systemPrompt,
      userPrompt,
      validate: validateQuestionnaireCopy,
      options: { temperature: 0.72, maxRetries: 2, maxRepairAttempts: 1 },
    });
  } catch {
    try {
      const raw = await generateWithGPT(systemPrompt, userPrompt, {
        temperature: 0.78,
        maxRetries: 2,
      });
      const parsed = validateQuestionnaireCopy(extractJsonFromText(raw));
      if (parsed) return parsed;
    } catch {
      /* use fallback */
    }
    return buildFallbackQuestionnaireCopy({ ...input, nicheKey, copyToneId });
  }
}
