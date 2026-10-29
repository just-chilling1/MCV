-- Tracks when a user completed the post-signup onboarding flow.
-- Safe to run multiple times. The application functions whether or not this
-- migration has been applied (the gate helper falls back gracefully).
ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS users_onboarding_completed_at_idx
    ON public.users (onboarding_completed_at);
