import { describe, expect, it } from "vitest";
import {
  fallbackSuggestedTone,
  parseSuggestedTone,
} from "@/features/article-wizard/lib/parse-suggested-tone";

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

  it("accepts suggestedTone / toneReason keys", () => {
    const result = parseSuggestedTone(
      '{"suggestedTone":"Bold","toneReason":"Punchy claims"}'
    );
    expect(result?.suggestedTone).toBe("bold");
    expect(result?.toneReason).toBe("Punchy claims");
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

  it("reads a plain-text tone word", () => {
    expect(parseSuggestedTone("I recommend the conversational tone.")?.suggestedTone).toBe(
      "conversational"
    );
  });
});

describe("fallbackSuggestedTone", () => {
  it("picks conversational for health niches", () => {
    expect(fallbackSuggestedTone("Health & Wellness").suggestedTone).toBe("conversational");
  });

  it("defaults to authoritative", () => {
    expect(fallbackSuggestedTone("SaaS & Software").suggestedTone).toBe("authoritative");
  });
});
