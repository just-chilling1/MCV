-- Store user-selected theme overrides on generated sites
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS theme_config jsonb NOT NULL DEFAULT '{}'::jsonb;
