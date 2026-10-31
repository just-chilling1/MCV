import { describe, expect, it } from "vitest";
import {
  ARTICLE_IMAGE_SLOTS,
  buildArticleImagePrompt,
  buildDfyCraftImagePrompt,
} from "@/features/article-images/lib/article-image-slots";

describe("buildDfyCraftImagePrompt", () => {
  it("names the topic and uses slot-specific scenes without generic mid copy", () => {
    const header = buildDfyCraftImagePrompt(
      "Best Trail Running Shoes",
      "<p>Cushioned soles for rocky paths.</p>",
      ARTICLE_IMAGE_SLOTS[0]
    );
    expect(header).toMatch(/Best Trail Running Shoes/);
    expect(header).toMatch(/wide establishing scene/i);
    expect(header).toMatch(/No text/);
    expect(header.length).toBeLessThanOrEqual(480);

    const mid = buildDfyCraftImagePrompt(
      "Best Trail Running Shoes",
      "<p>Cushioned soles for rocky paths.</p>",
      ARTICLE_IMAGE_SLOTS[1]
    );
    expect(mid).toMatch(/close-up/i);
    expect(mid).not.toMatch(/Data visualization or infographic/i);

    const genericMid = buildArticleImagePrompt(
      "Best Trail Running Shoes",
      "<p>Cushioned soles for rocky paths.</p>",
      ARTICLE_IMAGE_SLOTS[1]
    );
    expect(genericMid).toMatch(/close-up/i);
    expect(genericMid).not.toMatch(/Data visualization or infographic/i);

    const conclusion = buildDfyCraftImagePrompt(
      "Best Trail Running Shoes",
      "<p>Cushioned soles for rocky paths.</p>",
      ARTICLE_IMAGE_SLOTS[2]
    );
    expect(conclusion).toMatch(/real-world outcome/i);
  });
});
