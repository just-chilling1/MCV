import { createPublicSupabaseClient } from "@/lib/supabase-public";
import { findLiveSiteBySlug } from "@/features/blog-builder/lib/public-site-lookup";
import { getAppUrl } from "@/lib/brand-vars";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ siteSlug: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { siteSlug } = await params;
  const supabase = createPublicSupabaseClient();
  const base = process.env.NEXT_PUBLIC_APP_URL || getAppUrl();

  const site = await findLiveSiteBySlug<{ id: string; title: string; tagline: string | null }>(
    supabase,
    "id, title, tagline",
    siteSlug
  );

  if (!site) {
    return new Response("Not found", { status: 404 });
  }

  const { data: posts } = await supabase
    .from("live_posts")
    .select("title, slug, excerpt, created_at")
    .eq("site_id", site.id)
    .order("created_at", { ascending: false });

  const items = (posts ?? [])
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${base}/sites/${siteSlug}/${p.slug}</link>
      <guid>${base}/sites/${siteSlug}/${p.slug}</guid>
      <description>${escapeXml(p.excerpt ?? "")}</description>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${base}/sites/${siteSlug}</link>
    <description>${escapeXml(site.tagline ?? "")}</description>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml" },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
