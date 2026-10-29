import type { SocialPostResult } from "../types";

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "x-story-thread";
}

export function formatThreadPosts(posts: SocialPostResult[]): string {
  return posts
    .map((post, i) => {
      const header = `Post ${i + 1}${post.angle ? ` · ${post.angle}` : ""}`;
      const imageLine = post.imageUrl ? `\n\nImage: ${post.imageUrl}` : "";
      return `${header}\n${post.text.trim()}${imageLine}`;
    })
    .join("\n\n---\n\n");
}

export function formatPromotionKit(options: {
  siteName: string;
  territory: string;
  promoLink?: string;
  posts: SocialPostResult[];
  tags: { tag: string; reason: string }[];
}): string {
  const lines = [
    `${options.siteName} — X Promotion Kit`,
    `Niche: ${options.territory}`,
  ];

  if (options.promoLink) {
    lines.push(`Promotion link: ${options.promoLink}`);
  }

  if (options.posts.length > 0) {
    lines.push("", "=== STORY THREAD ===", "", formatThreadPosts(options.posts));
  }

  if (options.tags.length > 0) {
    lines.push(
      "",
      "=== BONUS HASHTAGS ===",
      "",
      options.tags.map((t) => t.tag).join(" "),
      "",
      options.tags.map((t) => `${t.tag} — ${t.reason}`).join("\n")
    );
  }

  return lines.join("\n");
}

export function threadExportFilename(siteName: string): string {
  return `${sanitizeFilename(siteName)}-x-thread.txt`;
}

export function promotionKitFilename(siteName: string): string {
  return `${sanitizeFilename(siteName)}-promotion-kit.txt`;
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
