-- Adds an onboarding completion timestamp on the users profile table.
-- The application is designed to keep working without this column —
-- the gate helper falls back to auth.user_metadata.onboarding_completed —
-- so this migration is fully optional and idempotent.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.users.onboarding_completed_at is
  'Best-effort timestamp written when the post-signup onboarding flow completes. Source of truth lives in auth.user_metadata.onboarding_completed.';

create index if not exists users_onboarding_completed_at_idx
  on public.users (onboarding_completed_at);
