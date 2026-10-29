import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import {
  loadOwnedPost,
  validatePostUpdate,
} from "@/features/blog-builder/lib/generation-pipeline";
import { sanitizePostHtml } from "@/features/blog-builder/lib/sanitize-html";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ postId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { postId } = await context.params;
  const post = await loadOwnedPost(supabase, user.id, postId);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ post }, { headers: NO_STORE_HEADERS });
}

export async function PATCH(request: Request, context: RouteContext) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { postId } = await context.params;
  const existing = await loadOwnedPost(supabase, user.id, postId);
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const body = await request.json();
  const updates = validatePostUpdate(body);
  if (!updates) {
    return NextResponse.json({ error: "Invalid update payload" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  if (typeof updates.html === "string") {
    updates.html = sanitizePostHtml(updates.html);
    if (updates.html.length < 100) {
      return NextResponse.json({ error: "Invalid update payload" }, { status: 400, headers: NO_STORE_HEADERS });
    }
  }

  const { data: post, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ post }, { headers: NO_STORE_HEADERS });
}
