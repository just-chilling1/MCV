import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getServiceRoleClient } from "@/lib/api-auth";

/**
 * Top-level app routes — a member handle must never shadow one of these,
 * since handles live at the URL root (/{handle}/sites/{slug}).
 */
const RESERVED_HANDLES = new Set([
  "academy", "accelerator", "analysis", "api", "arm-links", "asset", "auth",
  "autopilot", "brand-preview", "dashboard", "deploy", "dfy", "dfy-profit",
  "forgot-password", "instant", "license-rights", "link-vault", "login", "offers", "onboarding",
  "promote", "protector", "radar", "recurring-wealth", "replies", "reset-password",
  "sales-offer-generator", "scale-training", "search", "signup", "sites",
  "social-payouts", "support", "territory", "theme", "training", "admin",
  "member", "app", "www",
]);

function slugifyHandle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

function deriveHandleBase(user: User): string {
  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
  const emailPrefix = user.email?.split("@")[0] ?? "";
  const base = slugifyHandle(fullName || emailPrefix) || "member";
  return RESERVED_HANDLES.has(base) ? `${base}-member` : base;
}

function isMissingTableError(error: { code?: string } | null): boolean {
  return error?.code === "42P01";
}

/**
 * Return the member's reserved URL handle, creating one on first use.
 * Returns null when the user_handles migration has not been applied yet,
 * so callers can fall back to legacy /sites/{slug} behavior.
 */
export async function getOrCreateUserHandle(
  supabase: SupabaseClient,
  user: User
): Promise<string | null> {
  const { data: existing, error: selectError } = await supabase
    .from("user_handles")
    .select("handle")
    .eq("user_id", user.id)
    .maybeSingle();

  if (isMissingTableError(selectError)) return null;
  if (existing?.handle) return existing.handle as string;

  const service = getServiceRoleClient();
  if (!service) return null;
  const base = deriveHandleBase(user);

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { error } = await service
      .from("user_handles")
      .insert({ user_id: user.id, handle: candidate });

    if (!error) return candidate;
    if (isMissingTableError(error)) return null;

    if (error.code === "23505") {
      // Unique violation — either the handle is taken (try the next suffix)
      // or a concurrent request already created this user's row.
      const { data: raced } = await service
        .from("user_handles")
        .select("handle")
        .eq("user_id", user.id)
        .maybeSingle();
      if (raced?.handle) return raced.handle as string;
      continue;
    }

    return null;
  }

  return null;
}
