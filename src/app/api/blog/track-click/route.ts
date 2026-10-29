import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertPublicHttpUrl } from "@/lib/safe-url";
import { normalizeAffiliateUrl } from "@/features/blog-builder/lib/affiliate-url";
import type { ArmedLink } from "@/features/blog-builder/types";
import { getServiceRoleClient } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function normalizeDest(raw: string): string {
  return normalizeAffiliateUrl(raw).replace(/\/$/, "").toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to");
  const postId = searchParams.get("post");
  const siteId = searchParams.get("site");

  if (!to || !siteId) {
    return NextResponse.json({ error: "Missing destination or site" }, { status: 400 });
  }

  const normalizedTo = normalizeAffiliateUrl(to);
  if (!normalizedTo) {
    return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
  }

  let target: URL;
  try {
    target = assertPublicHttpUrl(normalizedTo);
  } catch {
    return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
  }

  // Prefer service role for the allowlist lookup so RLS never blocks a valid click;
  // redirect still only goes to urls stored on that site.
  const admin = getServiceRoleClient();
  const reader = admin ?? getAnonClient();

  const { data: site } = await reader
    .from("sites")
    .select("armed_links")
    .eq("id", siteId)
    .maybeSingle();

  const links = Array.isArray(site?.armed_links) ? (site.armed_links as ArmedLink[]) : [];
  const allowed = new Set(
    links
      .map((l) => {
        try {
          return normalizeDest(assertPublicHttpUrl(l.url).toString());
        } catch {
          return null;
        }
      })
      .filter((u): u is string => Boolean(u))
  );

  if (allowed.size === 0 || !allowed.has(normalizeDest(target.toString()))) {
    return NextResponse.json({ error: "Destination not allowed for this site" }, { status: 400 });
  }

  const clickWriter = admin ?? getAnonClient();
  await clickWriter.from("affiliate_clicks").insert({
    post_id: postId || null,
    site_id: siteId || null,
    link_url: target.toString(),
  });

  return NextResponse.redirect(target.toString(), 302);
}
