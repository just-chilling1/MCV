-- Personal member URLs: /{handle}/sites/{slug} with clean per-user slugs.

-- 1. Reserved unique handle per member (derived from their name at first site creation).
create table if not exists public.user_handles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  created_at timestamptz not null default now()
);

alter table public.user_handles enable row level security;

drop policy if exists "Users read own handle" on public.user_handles;
create policy "Users read own handle"
  on public.user_handles for select
  using (auth.uid() = user_id);

-- 2. Denormalized handle on sites so public pages resolve without a join.
alter table public.sites add column if not exists owner_handle text;

-- 3. Slugs become unique per member instead of globally, so clean names
--    like "your-personal-growth-compass" only get a suffix when the same
--    member reuses a name.
alter table public.sites drop constraint if exists sites_slug_key;
create unique index if not exists sites_user_slug_unique on public.sites (user_id, slug);
create index if not exists sites_owner_handle_slug_idx on public.sites (owner_handle, slug);
