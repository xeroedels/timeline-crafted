CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed boolean NOT NULL DEFAULT false,
  last_workspace_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_last_workspace_id_fkey
  FOREIGN KEY (last_workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;

CREATE TABLE public.workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX workspace_members_user_id_idx ON public.workspace_members(user_id);

CREATE TABLE public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, email)
);

CREATE INDEX workspace_invites_email_idx ON public.workspace_invites(email);

ALTER TABLE public.timelines
  ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN mode text NOT NULL DEFAULT 'personal' CHECK (mode IN ('personal', 'team')),
  ADD COLUMN template_id text;

CREATE INDEX timelines_workspace_id_idx ON public.timelines(workspace_id);

CREATE TABLE public.timeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id uuid NOT NULL REFERENCES public.timelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  requires_approval boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX timeline_stages_timeline_id_idx ON public.timeline_stages(timeline_id);

CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER timeline_stages_updated_at BEFORE UPDATE ON public.timeline_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  SELECT wi.workspace_id, NEW.id, 'member'
  FROM public.workspace_invites wi
  WHERE lower(wi.email) = lower(NEW.email)
    AND wi.accepted_at IS NULL
  ON CONFLICT DO NOTHING;

  UPDATE public.workspace_invites
  SET accepted_at = now()
  WHERE lower(email) = lower(NEW.email)
    AND accepted_at IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_workspace_invites_for_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  IF uid IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  SELECT wi.workspace_id, uid, 'member'
  FROM public.workspace_invites wi
  WHERE lower(wi.email) = lower(_email)
    AND wi.accepted_at IS NULL
  ON CONFLICT DO NOTHING;

  UPDATE public.workspace_invites
  SET accepted_at = now()
  WHERE lower(email) = lower(_email)
    AND accepted_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_workspace_invites_for_email(text) TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_stages TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.workspaces TO service_role;
GRANT ALL ON public.workspace_members TO service_role;
GRANT ALL ON public.workspace_invites TO service_role;
GRANT ALL ON public.timeline_stages TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Members read workspaces" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(id) OR created_by = auth.uid());
CREATE POLICY "Authenticated create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners update workspaces" ON public.workspaces
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = id AND user_id = auth.uid() AND role = 'owner'
    )
  );
CREATE POLICY "Owners delete workspaces" ON public.workspaces
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = id AND user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Members read membership" ON public.workspace_members
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Users join as owner on create" ON public.workspace_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.is_workspace_member(workspace_id)
  );
CREATE POLICY "Owners manage members" ON public.workspace_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.workspace_id = workspace_members.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    )
  );

CREATE POLICY "Members read invites" ON public.workspace_invites
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members create invites" ON public.workspace_invites
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND invited_by = auth.uid());
CREATE POLICY "Members update invites" ON public.workspace_invites
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members delete invites" ON public.workspace_invites
  FOR DELETE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users manage own timelines" ON public.timelines;
CREATE POLICY "Users access personal or workspace timelines" ON public.timelines
  FOR ALL
  USING (
    (workspace_id IS NULL AND user_id = auth.uid())
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR public.is_workspace_member(workspace_id)
    )
  );

DROP POLICY IF EXISTS "Users manage own events" ON public.timeline_events;
CREATE POLICY "Users access events on visible timelines" ON public.timeline_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.timelines t
      WHERE t.id = timeline_id
        AND (
          (t.workspace_id IS NULL AND t.user_id = auth.uid())
          OR (t.workspace_id IS NOT NULL AND public.is_workspace_member(t.workspace_id))
        )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.timelines t
      WHERE t.id = timeline_id
        AND (
          (t.workspace_id IS NULL AND t.user_id = auth.uid())
          OR (t.workspace_id IS NOT NULL AND public.is_workspace_member(t.workspace_id))
        )
    )
  );

CREATE POLICY "Users access stages on visible timelines" ON public.timeline_stages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.timelines t
      WHERE t.id = timeline_id
        AND (
          (t.workspace_id IS NULL AND t.user_id = auth.uid())
          OR (t.workspace_id IS NOT NULL AND public.is_workspace_member(t.workspace_id))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.timelines t
      WHERE t.id = timeline_id
        AND (
          (t.workspace_id IS NULL AND t.user_id = auth.uid())
          OR (t.workspace_id IS NOT NULL AND public.is_workspace_member(t.workspace_id))
        )
    )
  );
