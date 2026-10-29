create table if not exists public.thread_generation_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists thread_generation_log_user_created_idx
  on public.thread_generation_log (user_id, created_at desc);

alter table public.thread_generation_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'thread_generation_log'
      and policyname = 'Users read own thread generation log'
  ) then
    create policy "Users read own thread generation log"
      on public.thread_generation_log for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'thread_generation_log'
      and policyname = 'Users insert own thread generation log'
  ) then
    create policy "Users insert own thread generation log"
      on public.thread_generation_log for insert
      with check (auth.uid() = user_id);
  end if;
end $$;
