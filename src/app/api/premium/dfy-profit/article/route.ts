import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser, getServiceRoleClient } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { loadOwnedSite } from "@/features/blog-builder/lib/generation-pipeline";
import { generateAuthorityArticleForSite } from "@/features/dfy-profit/lib/generate-authority-article";
import { saveGeneratedAuthorityArticle } from "@/features/premium-recurring/lib/recurring-articles-vault";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = featureApiGuard("premium-dfy-profit");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
  const productContext = typeof body.productContext === "string" ? body.productContext : "";
  const productNameInput = typeof body.productName === "string" ? body.productName.trim() : "";
  const nicheInput = typeof body.niche === "string" ? body.niche.trim() : "";

  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const site = await loadOwnedSite(supabase, user.id, siteId);
  if (!site) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const productName = productNameInput || site.title || site.territory || site.hobby;
  const nicheLabel = nicheInput || site.hobby || site.territory || productName;

  try {
    const result = await generateAuthorityArticleForSite({
      site,
      productName,
      nicheLabel,
      productContext,
    });

    try {
      const saved = await saveGeneratedAuthorityArticle(
        supabase,
        user.id,
        siteId,
        result.title,
        result.html,
        { admin: getServiceRoleClient() }
      );

      return NextResponse.json(
        {
          id: saved.id,
          title: result.title,
          html: result.html,
          excerpt: result.excerpt,
        },
        { headers: NO_STORE_HEADERS }
      );
    } catch (saveErr) {
      // Still return the generated copy so the kit UI isn't empty if vault persistence fails.
      console.error("[dfy-profit/article] save failed after generation", saveErr);
      return NextResponse.json(
        {
          id: null,
          title: result.title,
          html: result.html,
          excerpt: result.excerpt,
          saveWarning:
            saveErr instanceof Error ? saveErr.message : "Article generated but not saved to Offers Library",
        },
        { headers: NO_STORE_HEADERS }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Article generation failed";
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
