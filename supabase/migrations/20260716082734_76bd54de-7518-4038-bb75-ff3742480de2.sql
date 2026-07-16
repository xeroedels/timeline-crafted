
CREATE TABLE public.timelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Timeline',
  description text NOT NULL DEFAULT '',
  favorite boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX timelines_user_id_idx ON public.timelines(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timelines TO authenticated;
GRANT ALL ON public.timelines TO service_role;
ALTER TABLE public.timelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own timelines" ON public.timelines
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id uuid NOT NULL REFERENCES public.timelines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New event',
  description text NOT NULL DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'milestone',
  tags text[] NOT NULL DEFAULT '{}',
  color text NOT NULL DEFAULT 'mint',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX timeline_events_timeline_id_idx ON public.timeline_events(timeline_id);
CREATE INDEX timeline_events_user_id_idx ON public.timeline_events(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_events TO authenticated;
GRANT ALL ON public.timeline_events TO service_role;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON public.timeline_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER timelines_updated_at BEFORE UPDATE ON public.timelines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER timeline_events_updated_at BEFORE UPDATE ON public.timeline_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
