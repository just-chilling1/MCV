import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCraftArticle } from "@/features/article-wizard/lib/generate-craft-article";

/** Article generation can take several RapidAPI retries (~2 min each). */
export const maxDuration = 300;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to generate articles." },
        { status: 401 }
      );
    }

    const apiKey = process.env.RAPIDAPI_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!apiKey && !openaiKey) {
      return NextResponse.json(
        {
          error:
            "Article generation is not configured. Add RAPIDAPI_KEY (ChatGPT on RapidAPI) and/or OPENAI_API_KEY.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { topic, platform, platforms, tone, length, affiliateLink, niche, customPrompt, productInfo } =
      body;

    const targetPlatforms: string[] = platforms || (platform ? [platform] : []);

    if (!topic || targetPlatforms.length === 0 || !tone || !length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const generated = await generateCraftArticle({
      topic,
      platforms: targetPlatforms,
      tone,
      length,
      affiliateLink,
      niche,
      productInfo,
      customPrompt,
    });

    return NextResponse.json(generated);
  } catch (error) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate article. Please try again.";
    const status = message.includes("could not be formatted") ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
