import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS, PRIVATE_READ_CACHE_HEADERS } from "@/lib/api-cache-headers";

export const dynamic = "force-dynamic";

const defaultSession = {
  step: 0,
  hobby: "",
  territory: "",
  niche: "",
  suggestions: [] as string[],
  territory_chosen: false,
  links_armed: false,
  theme_chosen: false,
  theme_config: {} as Record<string, unknown>,
  deploy_armed_links: [] as unknown[],
  deployed: false,
  site_id: null as string | null,
  site_slug: null as string | null,
  is_generating: false,
  generation_log: [] as string[],
  wizard_ui_step: 1,
};

export async function GET() {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { data } = await supabase
    .from("blog_builder_sessions")
    .select(
      "step, hobby, territory, niche, suggestions, territory_chosen, links_armed, theme_chosen, theme_config, deploy_armed_links, deployed, site_id, site_slug, is_generating, generation_log, wizard_ui_step"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ session: data ?? null }, { headers: PRIVATE_READ_CACHE_HEADERS });
}

export async function PUT(request: Request) {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json();

  const payload = {
    user_id: user.id,
    step: typeof body.step === "number" ? body.step : defaultSession.step,
    hobby: typeof body.hobby === "string" ? body.hobby : defaultSession.hobby,
    territory: typeof body.territory === "string" ? body.territory : defaultSession.territory,
    niche: typeof body.niche === "string" ? body.niche : defaultSession.niche,
    suggestions: Array.isArray(body.suggestions) ? body.suggestions : defaultSession.suggestions,
    territory_chosen: Boolean(body.territoryChosen ?? body.territory_chosen),
    links_armed: Boolean(body.linksArmed ?? body.links_armed),
    theme_chosen: Boolean(body.themeChosen ?? body.theme_chosen),
    theme_config:
      body.themeConfig && typeof body.themeConfig === "object"
        ? body.themeConfig
        : body.theme_config && typeof body.theme_config === "object"
          ? body.theme_config
          : defaultSession.theme_config,
    deploy_armed_links: Array.isArray(body.deployArmedLinks)
      ? body.deployArmedLinks
      : Array.isArray(body.deploy_armed_links)
        ? body.deploy_armed_links
        : defaultSession.deploy_armed_links,
    deployed: Boolean(body.deployed),
    site_id: typeof body.siteId === "string" ? body.siteId : body.site_id ?? null,
    site_slug: typeof body.siteSlug === "string" ? body.siteSlug : body.site_slug ?? null,
    is_generating: Boolean(body.isGenerating ?? body.is_generating ?? defaultSession.is_generating),
    generation_log: Array.isArray(body.generationLog)
      ? body.generationLog
      : Array.isArray(body.generation_log)
        ? body.generation_log
        : defaultSession.generation_log,
    wizard_ui_step: typeof body.wizardUiStep === "number"
      ? body.wizardUiStep
      : typeof body.wizard_ui_step === "number"
        ? body.wizard_ui_step
        : defaultSession.wizard_ui_step,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("blog_builder_sessions")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ session: data }, { headers: NO_STORE_HEADERS });
}

export async function DELETE() {
  const guard = featureApiGuard("blog-builder");
  if (guard) return guard;

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  await supabase.from("blog_builder_sessions").delete().eq("user_id", user.id);

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
