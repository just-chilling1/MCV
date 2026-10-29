-- Saved Recurring Stream articles per member offer (personalized with affiliate link)

create table if not exists public.site_recurring_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  template_id integer not null references public.premium_article_templates(id) on delete cascade,
  title text not null,
  html text not null,
  created_at timestamptz not null default now(),
  unique (user_id, site_id, template_id)
);

create index if not exists site_recurring_articles_user_site_idx
  on public.site_recurring_articles (user_id, site_id, created_at desc);

alter table public.site_recurring_articles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'site_recurring_articles' and policyname = 'Users read own recurring articles'
  ) then
    create policy "Users read own recurring articles"
      on public.site_recurring_articles for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'site_recurring_articles' and policyname = 'Users insert own recurring articles'
  ) then
    create policy "Users insert own recurring articles"
      on public.site_recurring_articles for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'site_recurring_articles' and policyname = 'Users update own recurring articles'
  ) then
    create policy "Users update own recurring articles"
      on public.site_recurring_articles for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'site_recurring_articles' and policyname = 'Users delete own recurring articles'
  ) then
    create policy "Users delete own recurring articles"
      on public.site_recurring_articles for delete using (auth.uid() = user_id);
  end if;
end $$;
