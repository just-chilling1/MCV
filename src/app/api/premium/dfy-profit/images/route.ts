import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { generateStoredArticleImage } from "@/app/api/generate-image/route";
import {
  ARTICLE_IMAGE_SLOTS,
  articleImageFromSlot,
  buildDfyCraftImagePrompt,
} from "@/features/article-images/lib/article-image-slots";
import { placeArticleImages } from "@/features/dfy-profit/lib/place-article-images";
import type { ArticleImage } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type ArticleInput = {
  id: string | null;
  title: string;
  content: string;
};

function parseArticle(raw: unknown): ArticleInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const content =
    typeof o.content === "string"
      ? o.content
      : typeof o.html === "string"
        ? o.html
        : "";
  if (!title && !content) return null;
  const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : null;
  return { id, title: title || "Article", content };
}

async function generateThreeImages(
  supabase: Parameters<typeof generateStoredArticleImage>[0],
  userId: string,
  title: string,
  content: string,
  idPrefix: string
): Promise<{ images: ArticleImage[]; error: string | null }> {
  const settled = await Promise.allSettled(
    ARTICLE_IMAGE_SLOTS.map(async (slot) => {
      const prompt = buildDfyCraftImagePrompt(title, content, slot);
      const url = await generateStoredArticleImage(supabase, userId, prompt);
      return articleImageFromSlot(slot, url, idPrefix);
    })
  );

  const images: ArticleImage[] = [];
  const failures: string[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") images.push(result.value);
    else {
      failures.push(
        result.reason instanceof Error ? result.reason.message : String(result.reason)
      );
    }
  }

  if (images.length === 0) {
    return {
      images: [],
      error: failures[0] || "Image generation failed for all slots",
    };
  }

  return { images, error: null };
}

/** Done-For-You Profit: embed Header / Mid / Conclusion images into the Craft article only. */
export async function POST(request: Request) {
  const guard = featureApiGuard("premium-dfy-profit");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const craft = parseArticle(body.craft);

  if (!craft) {
    return NextResponse.json(
      { error: "Provide craft article content" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { images, error } = await generateThreeImages(
    supabase,
    user.id,
    craft.title,
    craft.content,
    craft.id || "craft"
  );

  if (error) {
    return NextResponse.json(
      { craft: { content: craft.content, error }, error },
      { status: 502, headers: NO_STORE_HEADERS }
    );
  }

  const content = placeArticleImages(craft.content, images);

  if (craft.id) {
    const { error: saveError } = await supabase
      .from("articles")
      .update({
        content,
        images: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", craft.id)
      .eq("user_id", user.id);

    if (saveError) {
      console.error("[dfy-profit/images] craft save failed", saveError);
      return NextResponse.json(
        {
          craft: {
            content,
            error: saveError.message || "Images embedded but not saved to Vault",
          },
        },
        { headers: NO_STORE_HEADERS }
      );
    }
  }

  return NextResponse.json({ craft: { content } }, { headers: NO_STORE_HEADERS });
}
