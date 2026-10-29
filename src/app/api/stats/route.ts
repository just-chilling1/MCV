import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { featureApiGuard } from "@/lib/feature-api-guard";

export async function GET() {
  const blocked = featureApiGuard("core-workflow");
  if (blocked) return blocked;

  try {
    const { supabase, user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [searchesRes, analysisRes, variationsRes] = await Promise.allSettled([
      supabase.from("search_history").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("analysis_results").select("keyword", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("keyword_variations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    const totalSearches = searchesRes.status === "fulfilled" ? searchesRes.value.count ?? 0 : 0;
    const nichesAnalyzed = analysisRes.status === "fulfilled" ? analysisRes.value.count ?? 0 : 0;
    const keywordVariations = variationsRes.status === "fulfilled" ? variationsRes.value.count ?? 0 : 0;

    return NextResponse.json({ totalSearches, nichesAnalyzed, keywordVariations });
  } catch {
    return NextResponse.json({ totalSearches: 0, nichesAnalyzed: 0, keywordVariations: 0 });
  }
}
