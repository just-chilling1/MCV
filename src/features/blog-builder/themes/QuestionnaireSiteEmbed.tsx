"use client";

import { useMemo, useState } from "react";
import { extractQuestionnaireQuestions } from "../lib/extract-questionnaire";
import { parseSalesPageDocument } from "../lib/product-sales-page-html";
import { sanitizePostHtml } from "../lib/sanitize-html";
import type { QuestionnaireQuestion } from "../lib/questionnaire-copy";

interface QuestionnaireSiteEmbedProps {
  html: string;
}

type StaticParts = {
  nicheBadge: string;
  title: string;
  subtitle: string;
  intro: string;
  resultIcon: string;
  resultHeadline: string;
  resultMessage: string;
  promoHtml: string;
};

function textOf(el: Element | null): string {
  return el?.textContent?.trim() ?? "";
}

function parseStaticParts(safeBody: string): StaticParts | null {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(`<div>${safeBody}</div>`, "text/html");
  const intro = doc.querySelector('[data-step="0"]');
  const results = doc.querySelector('[data-step="results"]');
  if (!intro || !results) return null;

  const promo = results.querySelector(".promo-box");
  return {
    nicheBadge: textOf(intro.querySelector(".badge")),
    title: textOf(intro.querySelector("h1")),
    subtitle: textOf(intro.querySelector(".subtitle")),
    intro: textOf(intro.querySelector(".intro-text")),
    resultIcon: textOf(results.querySelector(".result-icon")) || "✓",
    resultHeadline: textOf(results.querySelector("h1")),
    resultMessage: textOf(results.querySelector(".intro-text")),
    promoHtml: promo ? sanitizePostHtml(promo.outerHTML) : "",
  };
}

function stepLabel(step: number, questionCount: number): string {
  if (step === 0) return "Getting started";
  if (step <= questionCount) return `Question ${step}`;
  return "Your results";
}

function ReactQuizPlayer({
  questions,
  parts,
  styles,
  googleFontsUrl,
}: {
  questions: QuestionnaireQuestion[];
  parts: StaticParts;
  styles: string;
  googleFontsUrl: string | null;
}) {
  const totalSteps = questions.length + 2;
  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined" && window.location.hash === "#offer") {
      return questions.length + 1;
    }
    return 0;
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const progressPct = Math.round((step / (totalSteps - 1)) * 100);
  const currentQuestion =
    step > 0 && step <= questions.length ? questions[step - 1] : null;

  return (
    <>
      {googleFontsUrl ? (
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      ) : null}
      {googleFontsUrl ? (
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      ) : null}
      {googleFontsUrl ? <link rel="stylesheet" href={googleFontsUrl} /> : null}
      {styles ? <style dangerouslySetInnerHTML={{ __html: styles }} /> : null}
      <div className="questionnaire-root min-h-screen isolate">
        <div className="quiz-shell">
          <div className="progress-wrap">
            <div className="progress-meta">
              <span>{stepLabel(step, questions.length)}</span>
              <span>
                {step + 1} / {totalSteps}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="quiz-card">
            {step === 0 ? (
              <div className="step active">
                {parts.nicheBadge ? <span className="badge">{parts.nicheBadge}</span> : null}
                <h1>{parts.title}</h1>
                {parts.subtitle ? <p className="subtitle">{parts.subtitle}</p> : null}
                {parts.intro ? <p className="intro-text">{parts.intro}</p> : null}
                <button type="button" className="btn-primary" onClick={() => setStep(1)}>
                  Start the quiz →
                </button>
              </div>
            ) : null}

            {currentQuestion ? (
              <div className="step active">
                <p className="badge">
                  Question {step} of {questions.length}
                </p>
                <p className="question-text">{currentQuestion.question}</p>
                <div className="options">
                  {currentQuestion.options.map((opt) => {
                    const selected = answers[currentQuestion.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`option-btn${selected ? " selected" : ""}`}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt.value }))
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!answers[currentQuestion.id]}
                  onClick={() => setStep(step + 1)}
                >
                  Continue →
                </button>
                {step > 1 ? (
                  <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)}>
                    ← Back
                  </button>
                ) : null}
              </div>
            ) : null}

            {step > questions.length ? (
              <div className="step active">
                <div className="result-icon">{parts.resultIcon}</div>
                <h1>{parts.resultHeadline}</h1>
                {parts.resultMessage ? <p className="intro-text">{parts.resultMessage}</p> : null}
                {parts.promoHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: parts.promoHtml }} />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

/** Client-only mount avoids hydration mismatch; never executes stored scripts. */
export function QuestionnaireSiteEmbed({ html }: QuestionnaireSiteEmbedProps) {
  const { styles, bodyHtml, googleFontsUrl } = useMemo(
    () => parseSalesPageDocument(html),
    [html]
  );
  const safeBody = useMemo(() => sanitizePostHtml(bodyHtml), [bodyHtml]);
  const extracted = useMemo(() => extractQuestionnaireQuestions(html), [html]);
  const parts = useMemo(() => parseStaticParts(safeBody), [safeBody]);

  if (extracted && parts) {
    return (
      <ReactQuizPlayer
        questions={extracted.questions}
        parts={parts}
        styles={styles}
        googleFontsUrl={googleFontsUrl ?? null}
      />
    );
  }

  return (
    <>
      {googleFontsUrl ? (
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      ) : null}
      {googleFontsUrl ? (
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      ) : null}
      {googleFontsUrl ? <link rel="stylesheet" href={googleFontsUrl} /> : null}
      {styles ? <style dangerouslySetInnerHTML={{ __html: styles }} /> : null}
      <div
        className="min-h-screen isolate"
        dangerouslySetInnerHTML={{ __html: safeBody }}
      />
    </>
  );
}
