import { describe, expect, it } from "vitest";
import {
  enrichArticlesWithLocalImages,
  SNIPPET_LIBRARY_PATH,
} from "@/lib/article-images-enrich";
import type { Article, ArticleImage } from "@/types";

const img = (id: string): ArticleImage => ({
  id,
  url: `https://example.com/${id}.jpg`,
  alt: id,
  section: "Header",
  position: "top",
});

function article(partial: Partial<Article> & { id: string }): Article {
  return {
    user_id: "u1",
    title: "T",
    content: "<p>x</p>",
    platform: "linkedin",
    tone: "authoritative",
    length: "long",
    status: "draft",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...partial,
  };
}

describe("enrichArticlesWithLocalImages", () => {
  it("prefers server images over local map", () => {
    const server = [img("server")];
    const local = { a1: [img("local")] };
    const { articles, imagePatches } = enrichArticlesWithLocalImages(
      [article({ id: "a1", images: server })],
      local
    );
    expect(articles[0].images).toEqual(server);
    expect(imagePatches.a1).toEqual(server);
  });

  it("uses local images only when server has none", () => {
    const localImgs = [img("local")];
    const { articles, imagePatches } = enrichArticlesWithLocalImages(
      [article({ id: "a1", images: [] })],
      { a1: localImgs }
    );
    expect(articles[0].images).toEqual(localImgs);
    expect(imagePatches).toEqual({});
  });
});

describe("SNIPPET_LIBRARY_PATH", () => {
  it("points at /snippets", () => {
    expect(SNIPPET_LIBRARY_PATH).toBe("/snippets");
  });
});
