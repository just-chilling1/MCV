-- Premium template storage: accelerator sales pages, recurring-stream articles, facebook posts

create table if not exists public.site_facebook_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  body text not null,
  batch_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists site_facebook_posts_user_site_idx
  on public.site_facebook_posts (user_id, site_id, created_at desc);

alter table public.site_facebook_posts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'site_facebook_posts' and policyname = 'Users read own facebook posts'
  ) then
    create policy "Users read own facebook posts"
      on public.site_facebook_posts for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'site_facebook_posts' and policyname = 'Users insert own facebook posts'
  ) then
    create policy "Users insert own facebook posts"
      on public.site_facebook_posts for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'site_facebook_posts' and policyname = 'Users delete own facebook posts'
  ) then
    create policy "Users delete own facebook posts"
      on public.site_facebook_posts for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Recurring Stream: 100 authority article templates (seed once, read by all members)
create table if not exists public.premium_article_templates (
  id serial primary key,
  template_key text not null unique,
  niche text not null,
  title text not null,
  slug text not null,
  html text not null,
  excerpt text,
  meta_description text,
  angle text,
  created_at timestamptz not null default now()
);

create index if not exists premium_article_templates_niche_idx
  on public.premium_article_templates (niche);

alter table public.premium_article_templates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'premium_article_templates' and policyname = 'Authenticated read article templates'
  ) then
    create policy "Authenticated read article templates"
      on public.premium_article_templates for select
      to authenticated using (true);
  end if;
end $$;

-- Members can browse shared accelerator template sites (owned by TEMPLATE_OWNER_ID)
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'sites' and policyname = 'read shared premium templates'
  ) then
    create policy "read shared premium templates"
      on public.sites for select
      to authenticated
      using (is_template = true and template_key is not null);
  end if;
end $$;

-- Template X threads readable by authenticated members
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'site_x_threads' and policyname = 'read template x threads'
  ) then
    create policy "read template x threads"
      on public.site_x_threads for select
      to authenticated
      using (
        exists (
          select 1 from public.sites s
          where s.id = site_x_threads.site_id
            and s.is_template = true
        )
      );
  end if;
end $$;
