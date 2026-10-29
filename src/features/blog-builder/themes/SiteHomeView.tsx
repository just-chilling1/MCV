import { PublicSiteRoot } from "./components/PublicSiteRoot";
import { SiteNav } from "./components/SiteNav";
import { SiteHeader } from "./components/SiteHeader";
import { SiteHero } from "./components/SiteHero";
import { PostList } from "./components/PostList";
import { SiteFooter } from "./components/SiteFooter";
import { isRecurringWealthSite, resolvePublicSiteTheme } from "./resolve-theme";
import type { PublicPostSummary, PublicSite } from "./types";

interface SiteHomeViewProps {
  site: PublicSite;
  siteSlug: string;
  posts: PublicPostSummary[];
}

export function SiteHomeView({ site, siteSlug, posts }: SiteHomeViewProps) {
  const premium = isRecurringWealthSite(site);
  const theme = resolvePublicSiteTheme(site);
  const pillar = posts.find((p) => p.is_pillar);
  const heroShowsPillar = theme.modules.hero === "featured-pillar";
  const excludeSlug = heroShowsPillar ? pillar?.slug : undefined;
  const showHomeHeader = theme.modules.hero !== "featured-pillar" || theme.modules.header !== "minimal";

  return (
    <PublicSiteRoot theme={theme} premium={premium}>
      <SiteNav site={site} siteSlug={siteSlug} />
      {showHomeHeader && <SiteHeader site={site} variant={theme.modules.header} />}
      <SiteHero variant={theme.modules.hero} site={site} siteSlug={siteSlug} posts={posts} />
      <main className="flex-1">
        <PostList
          posts={posts}
          siteSlug={siteSlug}
          variant={theme.modules.homeList}
          excludeSlug={excludeSlug}
        />
      </main>
      <SiteFooter site={site} siteSlug={siteSlug} variant={theme.modules.footer} relatedPosts={posts} />
    </PublicSiteRoot>
  );
}
