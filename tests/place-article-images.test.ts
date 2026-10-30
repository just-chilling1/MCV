import { describe, expect, it } from "vitest";
import { placeArticleImages } from "@/features/dfy-profit/lib/place-article-images";
import type { ArticleImage } from "@/types";

const images: ArticleImage[] = [
  {
    id: "h",
    url: "https://cdn.example/header.png",
    alt: "Header Image",
    section: "Header Image",
    position: "top",
  },
  {
    id: "m",
    url: "https://cdn.example/mid.png",
    alt: "Mid-Article Image",
    section: "Mid-Article Image",
    position: "middle",
  },
  {
    id: "c",
    url: "https://cdn.example/end.png",
    alt: "Conclusion Image",
    section: "Conclusion Image",
    position: "bottom",
  },
];

describe("placeArticleImages", () => {
  it("places header, mid, and conclusion in that order", () => {
    const html = [
      "<p>Intro one.</p>",
      "<p>Intro two.</p>",
      "<h2>Middle section</h2>",
      "<p>Body three.</p>",
      "<p>Body four.</p>",
      "<p>Closing.</p>",
    ].join("");

    const out = placeArticleImages(html, images);

    const headerAt = out.indexOf('data-article-image="top"');
    const midAt = out.indexOf('data-article-image="middle"');
    const endAt = out.indexOf('data-article-image="bottom"');

    expect(headerAt).toBeGreaterThanOrEqual(0);
    expect(midAt).toBeGreaterThan(headerAt);
    expect(endAt).toBeGreaterThan(midAt);
    expect(out).toContain('src="https://cdn.example/header.png"');
    expect(out).toContain('src="https://cdn.example/mid.png"');
    expect(out).toContain('src="https://cdn.example/end.png"');
  });

  it("replaces prior placed figures on re-run", () => {
    const once = placeArticleImages("<p>A</p><p>B</p><p>C</p>", images);
    const twice = placeArticleImages(once, [
      { ...images[0], url: "https://cdn.example/header-2.png" },
      images[1],
      images[2],
    ]);
    expect(twice.match(/data-article-image="top"/g)?.length).toBe(1);
    expect(twice).toContain("header-2.png");
    expect(twice).not.toContain("header.png");
  });
});
