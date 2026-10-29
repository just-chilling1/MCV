import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { resolveFastImageUrl } from "@/features/blog-builder/lib/images";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { user } = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const hobby = typeof body.hobby === "string" ? body.hobby.trim() : "";

  if (!title || !hobby) {
    return NextResponse.json({ error: "title and hobby are required" }, { status: 400 });
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : hobby;
  const scrapeUrl = typeof body.scrapeUrl === "string" ? body.scrapeUrl.trim() : "";

  // Preview path: return a directly-usable URL fast (no download/upload). It is
  // cached to Supabase later when the post is generated/saved.
  const image = await resolveFastImageUrl({
    title,
    subject,
    scrapeUrl: scrapeUrl || undefined,
  });

  return NextResponse.json(image);
}
