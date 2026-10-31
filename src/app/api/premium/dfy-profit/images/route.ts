import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { generateStoredArticleImage } from "@/app/api/generate-image/route";
import {
  ARTICLE_IMAGE_SLOTS,
  articleImageFromSlot,
  buildDfyCraftImagePrompt,
  type ArticleImageSlot,
} from "@/features/article-images/lib/article-image-slots";
import { placeArticleImages } from "@/features/dfy-profit/lib/place-article-images";
import {
  saveCraftArticleToVault,
  updateCraftArticleInVault,
} from "@/features/dfy-profit/lib/save-craft-to-vault";
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

async function generateSlotImage(
  supabase: Parameters<typeof generateStoredArticleImage>[0],
  userId: string,
  title: string,
  content: string,
  slot: ArticleImageSlot,
  idPrefix: string
): Promise<ArticleImage> {
  const prompt = buildDfyCraftImagePrompt(title, content, slot);
  const url = await generateStoredArticleImage(supabase, userId, prompt);
  return articleImageFromSlot(slot, url, idPrefix);
}

async function generateSlotWithRetry(
  supabase: Parameters<typeof generateStoredArticleImage>[0],
  userId: string,
  title: string,
  content: string,
  slot: ArticleImageSlot,
  idPrefix: string
): Promise<ArticleImage> {
  try {
    return await generateSlotImage(supabase, userId, title, content, slot, idPrefix);
  } catch (first) {
    try {
      return await generateSlotImage(supabase, userId, title, content, slot, idPrefix);
    } catch (second) {
      throw second instanceof Error ? second : first instanceof Error ? first : new Error(String(second));
    }
  }
}

/**
 * Header first (parallel gens often drop it to rate limits), then mid and
 * conclusion together.
 * ponytail: two slots in parallel. Ceiling is a provider 429 dropping one of
 * them; each slot still retries once. Upgrade path is a small queue if 429s climb.
 */
async function generateThreeImages(
  supabase: Parameters<typeof generateStoredArticleImage>[0],
  userId: string,
  title: string,
  content: string,
  idPrefix: string
): Promise<{ images: ArticleImage[]; error: string | null }> {
  const [headerSlot, ...rest] = ARTICLE_IMAGE_SLOTS;
  if (!headerSlot) {
    return { images: [], error: "Header image generation failed" };
  }

  let header: ArticleImage;
  try {
    header = await generateSlotWithRetry(supabase, userId, title, content, headerSlot, idPrefix);
  } catch (err) {
    return {
      images: [],
      error: err instanceof Error ? err.message : "Header image generation failed",
    };
  }

  const restImages = await Promise.all(
    rest.map(async (slot) => {
      try {
        return await generateSlotWithRetry(supabase, userId, title, content, slot, idPrefix);
      } catch (err) {
        console.error("[dfy-profit/images] slot failed", slot.id, err);
        return null;
      }
    })
  );

  return {
    images: [header, ...restImages.filter((img): img is ArticleImage => img !== null)],
    error: null,
  };
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

  if (!content.includes('data-article-image="top"')) {
    return NextResponse.json(
      {
        craft: { content: craft.content, error: "Header image was not embedded" },
        error: "Header image was not embedded",
      },
      { status: 502, headers: NO_STORE_HEADERS }
    );
  }

  let articleId = craft.id;

  try {
    if (articleId) {
      await updateCraftArticleInVault(supabase, user.id, articleId, {
        content,
        images: null,
      });
    } else {
      // Craft generation returned content without a Vault row — save now with images embedded.
      const saved = await saveCraftArticleToVault(supabase, user.id, {
        title: craft.title,
        content,
        images: null,
      });
      articleId = saved.id;
    }
  } catch (saveError) {
    console.error("[dfy-profit/images] craft save failed", saveError);
    return NextResponse.json(
      {
        craft: {
          id: articleId,
          content,
          error:
            saveError instanceof Error
              ? saveError.message
              : "Images embedded but not saved to Vault",
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { craft: { id: articleId, content } },
    { headers: NO_STORE_HEADERS }
  );
}
