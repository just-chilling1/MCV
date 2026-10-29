-- Tracks Start-Up Specialist popup CTA clicks for BlackBox Cash.
CREATE TABLE IF NOT EXISTS public.specialist_popup_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event text NOT NULL,
    user_id uuid,
    country text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS specialist_popup_events_event_created_idx
    ON public.specialist_popup_events (event, created_at);

ALTER TABLE public.specialist_popup_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert" ON public.specialist_popup_events;
CREATE POLICY "Allow anon insert" ON public.specialist_popup_events
    FOR INSERT WITH CHECK (true);
