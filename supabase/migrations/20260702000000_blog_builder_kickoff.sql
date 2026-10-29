-- Blog builder kickoff: link vault + wizard session (no sites/posts yet)

create table if not exists public.blog_builder_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  step smallint not null default 0 check (step >= 0 and step <= 3),
  hobby text not null default '',
  territory text not null default '',
  niche text not null default '',
  suggestions jsonb not null default '[]'::jsonb,
  territory_chosen boolean not null default false,
  links_armed boolean not null default false,
  theme_chosen boolean not null default false,
  theme_config jsonb not null default '{}'::jsonb,
  armed_links jsonb not null default '[]'::jsonb,
  deploy_armed_links jsonb not null default '[]'::jsonb,
  deployed boolean not null default false,
  site_id uuid,
  site_slug text,
  is_generating boolean not null default false,
  generation_log jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.link_vault (
  user_id uuid primary key references auth.users(id) on delete cascade,
  links jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.blog_builder_sessions enable row level security;
alter table public.link_vault enable row level security;

drop policy if exists "own blog builder session" on public.blog_builder_sessions;
create policy "own blog builder session" on public.blog_builder_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own link vault" on public.link_vault;
create policy "own link vault" on public.link_vault
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
