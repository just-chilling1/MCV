create table if not exists public.site_x_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  tag text not null,
  reason text,
  batch_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists site_x_tags_user_site_idx
  on public.site_x_tags (user_id, site_id, created_at desc);

alter table public.site_x_tags enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'site_x_tags' and policyname = 'Users read own site x tags'
  ) then
    create policy "Users read own site x tags"
      on public.site_x_tags for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'site_x_tags' and policyname = 'Users insert own site x tags'
  ) then
    create policy "Users insert own site x tags"
      on public.site_x_tags for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'site_x_tags' and policyname = 'Users delete own site x tags'
  ) then
    create policy "Users delete own site x tags"
      on public.site_x_tags for delete using (auth.uid() = user_id);
  end if;
end $$;

alter table public.blog_builder_sessions
  add column if not exists wizard_ui_step smallint not null default 1;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'blog_builder_sessions_wizard_ui_step_check'
  ) then
    alter table public.blog_builder_sessions drop constraint blog_builder_sessions_wizard_ui_step_check;
  end if;
  alter table public.blog_builder_sessions
    add constraint blog_builder_sessions_wizard_ui_step_check
    check (wizard_ui_step >= 1 and wizard_ui_step <= 4);
end $$;
