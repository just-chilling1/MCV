import { cachedClientFetch } from "@/lib/client-fetch-cache";
import { BLOG_SESSION_ROUTES, matchesBlogRoute } from "@/lib/blog-builder-routes";

const SITE_LIST_ROUTES = ["/offers", "/recurring-wealth"] as const;

export function warmBlogSession(): void {
  void cachedClientFetch("/api/blog/session").catch(() => {});
  void cachedClientFetch("/api/blog/link-vault").catch(() => {});
}

export function warmBlogSites(): void {
  void cachedClientFetch("/api/blog/site?lite=1").catch(() => {});
}

export function warmRecurringArticles(niche?: string): void {
  const q = niche && niche !== "All" ? `?niche=${encodeURIComponent(niche)}` : "";
  void cachedClientFetch(`/api/premium/recurring-stream/articles${q}`).catch(() => {});
}

/** Prefetch API data before navigation completes (sidebar hover / focus). */
export function warmRouteData(path: string): void {
  if (matchesBlogRoute(path, BLOG_SESSION_ROUTES)) {
    warmBlogSession();
  }
  if (matchesBlogRoute(path, SITE_LIST_ROUTES)) {
    warmBlogSites();
  }
  if (path === "/recurring-wealth" || path.startsWith("/recurring-wealth/")) {
    warmRecurringArticles();
  }
}
