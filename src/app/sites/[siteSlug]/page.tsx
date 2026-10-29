import type { Metadata } from "next";
import { createPublicSupabaseClient } from "@/lib/supabase-public";
import {
  buildSiteHomeMetadata,
  renderSiteHome,
  SITE_HOME_COLUMNS,
  SITE_HOME_META_COLUMNS,
  type SiteHomeRow,
  type SiteHomeMetaRow,
} from "@/features/blog-builder/lib/site-home-page";
import { findLiveSiteBySlug } from "@/features/blog-builder/lib/public-site-lookup";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ siteSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteSlug } = await params;
  const supabase = createPublicSupabaseClient();
  const site = await findLiveSiteBySlug<SiteHomeMetaRow>(
    supabase,
    SITE_HOME_META_COLUMNS,
    siteSlug
  );
  return buildSiteHomeMetadata(site);
}

export default async function SiteHomePage({ params }: Props) {
  const { siteSlug } = await params;
  const supabase = createPublicSupabaseClient();
  const site = await findLiveSiteBySlug<SiteHomeRow>(supabase, SITE_HOME_COLUMNS, siteSlug);
  if (!site) notFound();
  return renderSiteHome(supabase, site);
}
