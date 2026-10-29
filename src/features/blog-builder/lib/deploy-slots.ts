import { buildClusterTopics } from "./templates";
import { getSiteTerritory } from "./site-territory";
import type { BlogPost, BlogSite, PostSlotState } from "../types";

export function buildDeploySlots(
  site: Pick<BlogSite, "hobby" | "territory" | "title" | "tagline">,
  posts: BlogPost[]
): PostSlotState[] {
  const territory = getSiteTerritory(site);
  const topics = buildClusterTopics(territory, site.hobby);
  const bySlug = new Map(posts.map((p) => [p.slug, p]));

  return topics.map((topic) => {
    const post = bySlug.get(topic.slug);
    if (post) {
      return { topic, status: "complete" as const, progress: 100, post };
    }
    return { topic, status: "queued" as const, progress: 0 };
  });
}

export function firstQueuedSlotIndex(slots: PostSlotState[]): number {
  return slots.findIndex((s) => s.status !== "complete");
}
