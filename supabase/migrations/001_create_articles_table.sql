-- Run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates the articles table for storing generated articles

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  affiliate_link TEXT,
  niche TEXT,
  platform TEXT[] DEFAULT '{}',
  tone TEXT DEFAULT 'authoritative',
  length TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'draft',
  hook TEXT,
  cta TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own articles
DROP POLICY IF EXISTS "Users can read own articles" ON public.articles;
CREATE POLICY "Users can read own articles" ON public.articles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own articles" ON public.articles;
CREATE POLICY "Users can insert own articles" ON public.articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own articles" ON public.articles;
CREATE POLICY "Users can update own articles" ON public.articles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own articles" ON public.articles;
CREATE POLICY "Users can delete own articles" ON public.articles
  FOR DELETE USING (auth.uid() = user_id);
