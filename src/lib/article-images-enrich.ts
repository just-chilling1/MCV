import type { Article, ArticleImage } from "@/types";

/** Server images win; local map only fills gaps. Returns synced local map patches. */
export function enrichArticlesWithLocalImages(
  fetched: Article[],
  localImages: Record<string, ArticleImage[]>
): { articles: Article[]; imagePatches: Record<string, ArticleImage[]> } {
  const imagePatches: Record<string, ArticleImage[]> = {};
  const articles = fetched.map((a) => {
    if (a.images?.length) {
      imagePatches[a.id] = a.images;
      return a;
    }
    const saved = localImages[a.id];
    return saved?.length ? { ...a, images: saved } : a;
  });
  return { articles, imagePatches };
}

export const SNIPPET_LIBRARY_PATH = "/snippets";
