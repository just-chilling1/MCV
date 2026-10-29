-- Control-panel catalog for sidebar links, popups, and banners.
-- Service role writes this row. Members never query it directly.

CREATE TABLE IF NOT EXISTS public.site_promo_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  catalog jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_promo_settings ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.site_promo_settings TO service_role;
