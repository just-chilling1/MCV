import { NextResponse } from "next/server";
import { expandKeywords } from "@/features/core-workflow/lib/llm";
import { getApiUser } from "@/lib/api-auth";
import { featureApiGuard } from "@/lib/feature-api-guard";

export async function POST(req: Request) {
  const blocked = featureApiGuard("core-workflow");
  if (blocked) return blocked;

  try {
    const { supabase, user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { keyword } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Niche keyword required" }, { status: 400 });
    }

    let variations: string[] = [];
    const { data: existingVariations } = await supabase
      .from("keyword_variations")
      .select("variations")
      .eq("parent_keyword", keyword)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingVariations) {
      variations = existingVariations.variations;
    } else {
      variations = await expandKeywords(keyword);
      const { error: variationsError } = await supabase.from("keyword_variations").insert([
        {
          parent_keyword: keyword,
          variations,
          user_id: user.id,
        },
      ]);
      if (variationsError) {
        console.error("[search] keyword_variations insert failed:", variationsError.message);
        return NextResponse.json({ error: "Failed to save keyword variations" }, { status: 500 });
      }
    }

    const { error: historyError } = await supabase
      .from("search_history")
      .insert([{ keyword, user_id: user.id }]);
    if (historyError) {
      console.error("[search] search_history insert failed:", historyError.message);
      return NextResponse.json({ error: "Failed to save search history" }, { status: 500 });
    }

    return NextResponse.json({ variations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Search failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
