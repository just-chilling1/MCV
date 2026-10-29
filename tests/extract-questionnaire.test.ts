import { describe, expect, it } from "vitest";
import { extractQuestionnaireQuestions } from "@/features/blog-builder/lib/extract-questionnaire";

describe("extractQuestionnaireQuestions", () => {
  it("parses a valid questions array from stored HTML", () => {
    const html = `
      <script>
      (function() {
        var questions = [{"id":"q1","question":"How often?","options":[{"label":"Daily","value":"daily"},{"label":"Weekly","value":"weekly"}]}];
        var totalSteps = 3;
      })();
      </script>
    `;
    const extracted = extractQuestionnaireQuestions(html);
    expect(extracted?.questions).toHaveLength(1);
    expect(extracted?.questions[0]?.id).toBe("q1");
  });

  it("rejects a script payload that is not a questions array", () => {
    const html = `
      <script>
        var questions = [{"id":"q1","question":"<img src=x onerror=alert(1)>","options":"bad"}];
      </script>
    `;
    expect(extractQuestionnaireQuestions(html)).toBeNull();
  });

  it("rejects missing questions", () => {
    expect(extractQuestionnaireQuestions("<div>no script</div>")).toBeNull();
  });
});
