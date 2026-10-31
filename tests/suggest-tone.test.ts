import { describe, expect, it } from "vitest";
import { parseSuggestedTone } from "@/features/article-wizard/lib/parse-suggested-tone";

describe("parseSuggestedTone", () => {
  it("accepts a valid tone JSON object", () => {
    const result = parseSuggestedTone(
      '{"tone":"conversational","reason":"Friendly niche fit"}'
    );
    expect(result).toEqual({
      suggestedTone: "conversational",
      toneReason: "Friendly niche fit",
    });
  });

  it("rejects unknown tones", () => {
    expect(parseSuggestedTone('{"tone":"sarcastic","reason":"nope"}')).toBeNull();
  });

  it("unwraps fenced JSON", () => {
    const result = parseSuggestedTone(
      '```json\n{"tone":"bold","reason":"Strong claims sell"}\n```'
    );
    expect(result?.suggestedTone).toBe("bold");
  });
});
