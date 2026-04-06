-- =============================================================================
-- Migration 013: user_stats (XP bank, with role column for admin distinction)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_stats (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp            INTEGER      NOT NULL DEFAULT 0,
  level               INTEGER      NOT NULL DEFAULT 1,
  streak_freeze_count INTEGER      NOT NULL DEFAULT 0,
  role                TEXT         NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Users can read their own stats (including role)
CREATE POLICY "own_user_stats" ON public.user_stats
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read the role column (needed for admin checks via auth.uid())
CREATE POLICY "read_user_roles" ON public.user_stats
  FOR SELECT USING (true);

-- Only admins can change role values (admins can promote/demote users)
CREATE POLICY "admins_manage_roles" ON public.user_stats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_stats ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Trigger for auto-updating updated_at
CREATE OR REPLACE TRIGGER trg_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
