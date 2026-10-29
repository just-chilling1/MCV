-- Onboarding column on users profile table
ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS users_onboarding_completed_at_idx
    ON public.users (onboarding_completed_at);

-- Per-user scoping for feature tables (core-workflow module)
ALTER TABLE IF EXISTS public.search_history
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

ALTER TABLE IF EXISTS public.keyword_variations
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

ALTER TABLE IF EXISTS public.analysis_results
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON public.search_history (user_id);
CREATE INDEX IF NOT EXISTS keyword_variations_user_id_idx ON public.keyword_variations (user_id);
CREATE INDEX IF NOT EXISTS analysis_results_user_id_idx ON public.analysis_results (user_id);
