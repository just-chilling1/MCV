import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { generateStoredArticleImage } from "@/app/api/generate-image/route";
import {
  ARTICLE_IMAGE_SLOTS,
  articleImageFromSlot,
  buildArticleImagePrompt,
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
      const prompt = buildArticleImagePrompt(title, content, slot);
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

/** Done-For-You Profit: embed Header / Mid / Conclusion images into article HTML. */
export async function POST(request: Request) {
  const guard = featureApiGuard("premium-dfy-profit");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const craft = parseArticle(body.craft);
  const authority = parseArticle(body.authority);

  if (!craft && !authority) {
    return NextResponse.json(
      { error: "Provide craft and/or authority article content" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const response: {
    craft?: { content: string; error?: string };
    authority?: { html: string; error?: string };
  } = {};

  if (craft) {
    const { images, error } = await generateThreeImages(
      supabase,
      user.id,
      craft.title,
      craft.content,
      craft.id || "craft"
    );

    if (error) {
      response.craft = { content: craft.content, error };
    } else {
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
          response.craft = {
            content,
            error: saveError.message || "Images embedded but not saved to Vault",
          };
        } else {
          response.craft = { content };
        }
      } else {
        response.craft = { content };
      }
    }
  }

  if (authority) {
    const { images, error } = await generateThreeImages(
      supabase,
      user.id,
      authority.title,
      authority.content,
      authority.id || "authority"
    );

    if (error) {
      response.authority = { html: authority.content, error };
    } else {
      const html = placeArticleImages(authority.content, images);

      if (authority.id) {
        const { error: saveError } = await supabase
          .from("site_recurring_articles")
          .update({ html })
          .eq("id", authority.id)
          .eq("user_id", user.id);

        if (saveError) {
          console.error("[dfy-profit/images] authority save failed", saveError);
          response.authority = {
            html,
            error: saveError.message || "Images embedded but not saved to Offers Library",
          };
        } else {
          response.authority = { html };
        }
      } else {
        response.authority = { html };
      }
    }
  }

  const craftOk = Boolean(response.craft?.content?.includes("data-article-image"));
  const authorityOk = Boolean(response.authority?.html?.includes("data-article-image"));
  const bothFailed =
    (craft ? !craftOk : true) &&
    (authority ? !authorityOk : true) &&
    Boolean(response.craft?.error || response.authority?.error);

  if (bothFailed && (craft || authority)) {
    const message =
      response.craft?.error ||
      response.authority?.error ||
      "Image generation failed";
    return NextResponse.json(
      { ...response, error: message },
      { status: 502, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(response, { headers: NO_STORE_HEADERS });
}
