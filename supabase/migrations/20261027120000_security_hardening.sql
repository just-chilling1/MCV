-- Security hardening: column-limited public views, users RLS, click inserts,
-- storage list scope, articles.images, and conditional workflow-table RLS.
-- Apply on the shared project; do not re-run earlier migrations.

-- 1. Articles: persist image payloads from Unlimited / Visual Lab
alter table public.articles
  add column if not exists images jsonb;

-- 2. public.users RLS only when that profile table exists
do $$
begin
  if to_regclass('public.users') is not null then
    execute 'alter table public.users enable row level security';
    execute 'drop policy if exists "Users read own profile" on public.users';
    execute $p$
      create policy "Users read own profile" on public.users
        for select using (auth.uid() = id)
    $p$;
    execute 'drop policy if exists "Users update own profile" on public.users';
    execute $p$
      create policy "Users update own profile" on public.users
        for update using (auth.uid() = id) with check (auth.uid() = id)
    $p$;
    execute 'revoke all on table public.users from anon';
    execute 'grant select, update on table public.users to authenticated';
  end if;
end $$;

-- 3. Drop table-wide live selects; expose column-limited views instead
do $$
begin
  if to_regclass('public.sites') is not null then
    execute 'drop policy if exists "public live sites" on public.sites';
  end if;
  if to_regclass('public.posts') is not null then
    execute 'drop policy if exists "public live posts" on public.posts';
  end if;
end $$;

create or replace view public.live_sites
with (security_invoker = false)
as
select
  id,
  title,
  tagline,
  slug,
  hobby,
  territory,
  theme,
  theme_config,
  template_key,
  site_type,
  sales_page_html,
  sales_page_json,
  owner_handle,
  armed_links,
  created_at
from public.sites
where status = 'live';

create or replace view public.live_posts
with (security_invoker = false)
as
select
  id,
  site_id,
  title,
  slug,
  html,
  excerpt,
  meta_description,
  image_url,
  image_alt,
  is_pillar,
  status,
  publish_at,
  views,
  created_at
from public.posts
where status = 'live';

revoke all on public.live_sites from public;
revoke all on public.live_posts from public;
grant select on public.live_sites to anon, authenticated;
grant select on public.live_posts to anon, authenticated;

-- 4. Affiliate clicks: only service role / definer paths insert
do $$
begin
  if to_regclass('public.affiliate_clicks') is not null then
    execute 'drop policy if exists "insert clicks" on public.affiliate_clicks';
  end if;
end $$;

-- 5. blog-images: keep public object URLs, stop bucket-wide listing for anon
drop policy if exists "blog images public read" on storage.objects;
create policy "blog images owner read" on storage.objects
  for select using (
    bucket_id = 'blog-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public bucket URLs still work without a SELECT policy; members can list their own folder.

-- 6. Specialist popup: drop open insert; tracking uses the RPC / service role
do $$
begin
  if to_regclass('public.specialist_popup_events') is not null then
    execute 'drop policy if exists "Allow anon insert" on public.specialist_popup_events';
  end if;
end $$;

-- 7. Workflow tables (may exist on the shared project from skeleton apps)
do $$
begin
  if to_regclass('public.search_history') is not null then
    execute 'alter table public.search_history enable row level security';
    execute 'drop policy if exists "own search history" on public.search_history';
    execute $p$
      create policy "own search history" on public.search_history
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id)
    $p$;
  end if;

  if to_regclass('public.keyword_variations') is not null then
    execute 'alter table public.keyword_variations enable row level security';
    execute 'drop policy if exists "own keyword variations" on public.keyword_variations';
    execute $p$
      create policy "own keyword variations" on public.keyword_variations
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id)
    $p$;
  end if;

  if to_regclass('public.analysis_results') is not null then
    execute 'alter table public.analysis_results enable row level security';
    execute 'drop policy if exists "own analysis results" on public.analysis_results';
    execute $p$
      create policy "own analysis results" on public.analysis_results
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id)
    $p$;
  end if;
end $$;
