-- Server-side power-up access: grants per user + invite tokens (service role only for writes on tokens / grants)

create table if not exists public.powerup_access_tokens (
  token text primary key,
  powerup text not null check (powerup in ('10x', 'infinite', 'automation', 'dfy')),
  expires_at timestamptz,
  max_uses int not null default 1,
  uses_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_powerup_grants (
  user_id uuid not null references auth.users (id) on delete cascade,
  powerup text not null check (powerup in ('10x', 'infinite', 'automation', 'dfy')),
  granted_at timestamptz not null default now(),
  primary key (user_id, powerup)
);

create index if not exists user_powerup_grants_user_id_idx on public.user_powerup_grants (user_id);

alter table public.powerup_access_tokens enable row level security;
alter table public.user_powerup_grants enable row level security;

-- No policies on powerup_access_tokens: only service_role can read/write via API

create policy "Users can read own powerup grants"
  on public.user_powerup_grants
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Inserts/updates on grants are performed with service role in /api/powerups/register

comment on table public.powerup_access_tokens is 'Invite secrets for /access/[type]?t=...; manage rows via SQL or Supabase dashboard; never expose service role key.';
comment on table public.user_powerup_grants is 'Which power-ups each auth user has unlocked after registering via a valid access token.';
