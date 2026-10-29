import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { slugify } from "@/features/blog-builder/lib/seo";
import { getOrCreateUserHandle } from "@/lib/user-handle";
import { buildSiteTitle, buildSiteTagline, themeFromConfig } from "@/features/blog-builder/themes";
import { getDailyGenerationQuota } from "@/features/blog-builder/lib/site-quota";
import type { ArmedLink, ThemeConfig } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";

async function linkSiteToSession(
  supabase: Awaited<ReturnType<typeof getApiUser>>["supabase"],
  userId: string,
  siteId: string,
  siteSlug: string
) {
  await supabase.from("blog_builder_sessions").upsert(
    {
      user_id: userId,
      site_id: siteId,
      site_slug: siteSlug,
      step: 3,
      deployed: false,
      is_generating: false,
      generation_log: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quota = await getDailyGenerationQuota(supabase, user.id);
  if (!quota.unlimited && (quota.remaining ?? 0) <= 0) {
    return NextResponse.json(
      {
        error: `Daily limit reached (${quota.limit} new websites per day). Try again tomorrow.`,
        quota,
      },
      { status: 429 }
    );
  }

  const body = await request.json();
  const hobby = typeof body.hobby === "string" ? body.hobby.trim() : "";
  const territory =
    typeof body.territory === "string" ? body.territory.trim() : hobby;
  const armedLinks = Array.isArray(body.armedLinks) ? (body.armedLinks as ArmedLink[]) : [];
  const themeConfig =
    body.themeConfig && typeof body.themeConfig === "object"
      ? (body.themeConfig as ThemeConfig)
      : null;

  if (!hobby) return NextResponse.json({ error: "hobby is required" }, { status: 400 });

  const title = buildSiteTitle(hobby);
  const theme = themeFromConfig(themeConfig);

  // Clean, human-readable slug from the site name, unique per member:
  // "your-personal-growth-compass", then "-2", "-3" only when the same
  // member reuses the name.
  const baseSlug = slugify(title) || slugify(territory) || slugify(hobby) || "site";
  const { data: existingRows } = await supabase
    .from("sites")
    .select("slug")
    .eq("user_id", user.id)
    .like("slug", `${baseSlug}%`);
  const taken = new Set((existingRows ?? []).map((row) => row.slug as string));
  let slug = baseSlug;
  for (let n = 2; taken.has(slug); n++) {
    slug = `${baseSlug}-${n}`;
  }

  const ownerHandle = await getOrCreateUserHandle(supabase, user);

  const baseRow = {
    user_id: user.id,
    hobby,
    territory,
    title,
    tagline: buildSiteTagline(hobby),
    theme,
    theme_config: themeConfig ?? {},
    armed_links: armedLinks,
    status: "draft",
    site_type: "product",
  };

  // Fallbacks for environments where the handles migration hasn't run yet:
  // 42703 = owner_handle column missing (retry without it), 23505 = legacy
  // global slug uniqueness collided with another member (retry with suffix).
  const attempts: Record<string, unknown>[] = [
    { ...baseRow, slug, owner_handle: ownerHandle },
    { ...baseRow, slug },
    { ...baseRow, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` },
  ];

  let data: Record<string, unknown> | null = null;
  let error: { code?: string; message: string } | null = null;
  for (const row of attempts) {
    ({ data, error } = await supabase.from("sites").insert(row).select().single());
    if (!error) break;
    if (error.code !== "42703" && error.code !== "23505") break;
  }

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create site" },
      { status: 500 }
    );
  }

  const site = data as { id: string; slug: string };
  await linkSiteToSession(supabase, user.id, site.id, site.slug);

  const quotaAfter = {
    ...quota,
    usedToday: quota.usedToday + 1,
    remaining: quota.unlimited ? null : Math.max(0, (quota.remaining ?? 0) - 1),
  };

  return NextResponse.json({ site: data, quota: quotaAfter });
}
