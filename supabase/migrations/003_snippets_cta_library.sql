-- Snippet / CTA library: per-user reusable copy blocks

CREATE TABLE IF NOT EXISTS public.snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'snippet' CHECK (kind IN ('snippet', 'cta')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS snippets_user_id_idx ON public.snippets (user_id);

ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own snippets" ON public.snippets;
CREATE POLICY "Users can read own snippets" ON public.snippets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own snippets" ON public.snippets;
CREATE POLICY "Users can insert own snippets" ON public.snippets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own snippets" ON public.snippets;
CREATE POLICY "Users can update own snippets" ON public.snippets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own snippets" ON public.snippets;
CREATE POLICY "Users can delete own snippets" ON public.snippets
  FOR DELETE USING (auth.uid() = user_id);
