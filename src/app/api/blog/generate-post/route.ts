import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { generateBlogPostContent } from "@/features/blog-builder/lib/generate-content";
import { weaveAffiliateLinks } from "@/features/blog-builder/lib/affiliate";
import { scrapePage, buildProductContext } from "@/features/blog-builder/lib/scrape";
import type { ArmedLink } from "@/features/blog-builder/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const hobby = typeof body.hobby === "string" ? body.hobby.trim() : "";
  const postId = typeof body.postId === "string" ? body.postId : "preview";
  const siteId = typeof body.siteId === "string" ? body.siteId : "preview";
  const armedLinks = Array.isArray(body.armedLinks) ? (body.armedLinks as ArmedLink[]) : [];
  const affiliateUrl = typeof body.affiliateUrl === "string" ? body.affiliateUrl : "";

  if (!topic || !hobby) {
    return NextResponse.json({ error: "topic and hobby are required" }, { status: 400 });
  }

  let productContext = "";
  if (affiliateUrl) {
    const scraped = await scrapePage(affiliateUrl);
    if (scraped) {
      productContext = buildProductContext(scraped);
    }
  }

  const territory = typeof body.territory === "string" ? body.territory.trim() : hobby;
  const content = await generateBlogPostContent({
    topic,
    territory,
    hobby,
    affiliateContext: armedLinks.map((l) => `${l.label}: ${l.url}`).join("\n"),
    productContext,
  });

  const html = weaveAffiliateLinks(content.html, armedLinks, postId, siteId);

  return NextResponse.json({ ...content, html });
}
