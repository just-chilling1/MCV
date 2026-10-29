-- Start-Up Specialist popup analytics. Inserts go through the RPC only.
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

CREATE OR REPLACE FUNCTION public.track_specialist_popup(p_event text, p_country text, p_user_agent text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_event NOT IN ('cta_call_click', 'popup_open') THEN
    RAISE EXCEPTION 'invalid event';
  END IF;

  INSERT INTO public.specialist_popup_events (event, user_id, country, user_agent)
  VALUES (
    p_event,
    auth.uid(),
    left(COALESCE(p_country, ''), 16),
    left(COALESCE(p_user_agent, ''), 300)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.track_specialist_popup(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_specialist_popup(text, text, text) TO anon, authenticated;
