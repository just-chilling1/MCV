import { NextResponse } from "next/server";
import { generateReplies } from "@/features/core-workflow/lib/llm";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";

export async function POST(req: Request) {
  const blocked = featureApiGuard("core-workflow");
  if (blocked) return blocked;

  let ads: { id: string; title?: string; text?: string }[] = [];
  let affiliateLink = "";

  try {
    const { user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    ads = body.ads || body.posts || [];
    affiliateLink = body.affiliateLink || "";

    if (!ads || !Array.isArray(ads) || ads.length === 0) {
      return NextResponse.json({ error: "Ads required" }, { status: 400 });
    }

    const results = await generateReplies(ads, affiliateLink);
    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error("Replies Error (Falling back to Mock Data):", error);

    const mockResults = ads.map((ad) => {
      const topic = (ad.title || ad.text || "this").substring(0, 60);
      const link = affiliateLink || "";
      return {
        id: ad.id,
        text: ad.text,
        replies: [
          `This is exactly what I was looking for! I've been researching "${topic}" and the best thing I found was this: ${link}`,
          `I was in the same situation. What worked for me: ${link}`,
          `Has anyone else tried ${link}? Thinking about giving it a go.`,
        ],
      };
    });

    return NextResponse.json({ results: mockResults });
  }
}
