-- Blog builder sites, posts, and affiliate click tracking

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hobby text not null,
  territory text,
  title text not null,
  tagline text,
  slug text unique not null,
  theme text not null default 'obsidian',
  theme_config jsonb not null default '{}'::jsonb,
  armed_links jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'live')),
  is_template boolean not null default false,
  template_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null,
  html text not null,
  excerpt text,
  meta_description text,
  image_url text,
  image_alt text,
  is_pillar boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live')),
  publish_at timestamptz,
  views int not null default 0,
  created_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  link_url text,
  created_at timestamptz not null default now()
);

create index if not exists sites_user_id_idx on public.sites(user_id);
create index if not exists posts_site_id_idx on public.posts(site_id);
create index if not exists posts_status_idx on public.posts(status);
create index if not exists sites_slug_idx on public.sites(slug);
create index if not exists affiliate_clicks_site_id_idx on public.affiliate_clicks(site_id);

alter table public.sites enable row level security;
alter table public.posts enable row level security;
alter table public.affiliate_clicks enable row level security;

drop policy if exists "own sites" on public.sites;
create policy "own sites" on public.sites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "public live sites" on public.sites;
create policy "public live sites" on public.sites
  for select using (status = 'live');

drop policy if exists "own posts" on public.posts;
create policy "own posts" on public.posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "public live posts" on public.posts;
create policy "public live posts" on public.posts
  for select using (status = 'live');

drop policy if exists "insert clicks" on public.affiliate_clicks;
create policy "insert clicks" on public.affiliate_clicks
  for insert with check (true);

drop policy if exists "own clicks read" on public.affiliate_clicks;
create policy "own clicks read" on public.affiliate_clicks
  for select using (
    exists (
      select 1 from public.sites s
      where s.id = affiliate_clicks.site_id and s.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;

drop policy if exists "blog images public read" on storage.objects;
create policy "blog images public read" on storage.objects
  for select using (bucket_id = 'blog-images');

drop policy if exists "blog images auth upload" on storage.objects;
create policy "blog images auth upload" on storage.objects
  for insert with check (
    bucket_id = 'blog-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "blog images auth update" on storage.objects;
create policy "blog images auth update" on storage.objects
  for update using (
    bucket_id = 'blog-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create or replace function public.increment_post_views(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set views = views + 1 where id = post_id and status = 'live';
end;
$$;

grant execute on function public.increment_post_views(uuid) to anon, authenticated;
