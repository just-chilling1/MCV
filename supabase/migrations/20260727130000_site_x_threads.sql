create table if not exists public.site_x_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  text text not null,
  angle text,
  batch_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists site_x_threads_user_site_idx
  on public.site_x_threads (user_id, site_id, created_at desc);

alter table public.site_x_threads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'site_x_threads'
      and policyname = 'Users read own site x threads'
  ) then
    create policy "Users read own site x threads"
      on public.site_x_threads for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'site_x_threads'
      and policyname = 'Users insert own site x threads'
  ) then
    create policy "Users insert own site x threads"
      on public.site_x_threads for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'site_x_threads'
      and policyname = 'Users delete own site x threads'
  ) then
    create policy "Users delete own site x threads"
      on public.site_x_threads for delete
      using (auth.uid() = user_id);
  end if;
end $$;
