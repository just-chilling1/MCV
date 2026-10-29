/** Routes that load blog session + link vault (prefetch / warm). */
export const BLOG_SESSION_ROUTES = [
  "/sales-offer-generator",
  "/territory",
  "/theme",
  "/arm-links",
  "/offers",
  "/link-vault",
  "/links",
  "/deploy",
  "/recurring-wealth",
] as const;

/** Routes that mount the full BlogBuilderProvider (useBlogBuilder). */
export const BLOG_BUILDER_CONTEXT_ROUTES = [
  "/sales-offer-generator",
  "/territory",
  "/theme",
  "/arm-links",
  "/link-vault",
  "/links",
  "/deploy",
] as const;

/** Sales Offer Generator always starts a clean wizard — skip restoring session. */
export const FRESH_WIZARD_ROUTES = ["/sales-offer-generator"] as const;

export function matchesBlogRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function needsBlogSession(pathname: string): boolean {
  return matchesBlogRoute(pathname, BLOG_SESSION_ROUTES);
}

export function needsBlogBuilderContext(pathname: string): boolean {
  return matchesBlogRoute(pathname, BLOG_BUILDER_CONTEXT_ROUTES);
}

export function shouldStartFreshWizard(pathname: string): boolean {
  return matchesBlogRoute(pathname, FRESH_WIZARD_ROUTES);
}
