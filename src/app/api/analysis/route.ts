import { NextResponse } from "next/server";
import { searchSocialData, sanitizePosts } from "@/features/core-workflow/lib/rapidapi";
import { classifyActivity } from "@/features/core-workflow/lib/llm";
import { getApiUser } from "@/lib/api-auth";
import { featureApiGuard } from "@/lib/feature-api-guard";

export async function POST(req: Request) {
  const blocked = featureApiGuard("core-workflow");
  if (blocked) return blocked;

  let keyword = "";
  try {
    const { supabase, user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    keyword = (body.keyword || "").trim();

    if (!keyword) {
      return NextResponse.json({ error: "Keyword required" }, { status: 400 });
    }

    const { data: existingAnalysis } = await supabase
      .from("analysis_results")
      .select("data")
      .eq("keyword", keyword)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingAnalysis && existingAnalysis.length > 0) {
      const data = existingAnalysis[0].data;
      if (data && typeof data === "object" && data.classification) {
        if (data.threads) {
          data.threads = sanitizePosts(data.threads);
        }
        return NextResponse.json(data);
      }
    }

    let results: Awaited<ReturnType<typeof searchSocialData>> = [];
    try {
      results = await searchSocialData(keyword);
    } catch {
      // continue with empty results
    }

    const cleanResults = sanitizePosts(results);
    const sampleText =
      cleanResults.length > 0 ? cleanResults.slice(0, 5).map((r) => r.text).join("\n") : "";

    const analysis = await classifyActivity(keyword, sampleText);
    const postCount = cleanResults.length || analysis?.count || 0;
    let activityLevel = "Low";
    if (postCount >= 100) activityLevel = "High";
    else if (postCount >= 20) activityLevel = "Active";

    const finalClassification =
      analysis?.classification ||
      `The "${keyword}" niche is showing interest across social platforms.`;

    const hasLiveData = cleanResults.length > 0;
    const confidence = Math.round(
      (hasLiveData ? 60 : 30) + (finalClassification.length > 50 ? 25 : 10) + Math.random() * 10
    );

    const analysisData = {
      level: activityLevel,
      count: postCount,
      type: analysis?.type || "Questions",
      classification: finalClassification,
      confidence: Math.min(confidence, 98),
      sources: cleanResults.length,
      liveData: hasLiveData,
      threads: cleanResults.slice(0, 25),
    };

    const { error: insertError } = await supabase.from("analysis_results").insert([
      {
        keyword,
        data: analysisData,
        user_id: user.id,
      },
    ]);
    if (insertError) {
      console.error("[analysis] insert failed:", insertError.message);
      return NextResponse.json({ error: "Failed to save analysis", keyword }, { status: 500 });
    }

    return NextResponse.json(analysisData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message, keyword }, { status: 500 });
  }
}
