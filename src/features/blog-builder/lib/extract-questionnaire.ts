import type { QuestionnaireQuestion } from "./questionnaire-copy";

export type ExtractedQuestionnaire = {
  questions: QuestionnaireQuestion[];
};

function isQuestion(value: unknown): value is QuestionnaireQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as Record<string, unknown>;
  if (typeof q.id !== "string" || typeof q.question !== "string") return false;
  if (!Array.isArray(q.options) || q.options.length === 0) return false;
  return q.options.every((opt) => {
    if (!opt || typeof opt !== "object") return false;
    const o = opt as Record<string, unknown>;
    return typeof o.label === "string" && typeof o.value === "string";
  });
}

/**
 * Pull the questions array out of stored questionnaire HTML without running scripts.
 * Returns null when the payload is missing or fails a strict shape check.
 */
export function extractQuestionnaireQuestions(html: string): ExtractedQuestionnaire | null {
  const match = html.match(/var\s+questions\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!match?.[1]) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  if (!parsed.every(isQuestion)) return null;

  return { questions: parsed };
}
