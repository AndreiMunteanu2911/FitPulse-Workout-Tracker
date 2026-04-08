-- =============================================================================
-- Migration 019: Form score logs (track form checking history per user)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.form_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id    TEXT NOT NULL REFERENCES public.exercises(exercise_id) ON DELETE CASCADE,
  score          INTEGER NOT NULL,          -- 0–100 form score
  reps           INTEGER NOT NULL DEFAULT 0,
  duration_ms    INTEGER NOT NULL DEFAULT 0, -- session duration in milliseconds
  feedback_notes TEXT,                       -- optional AI-generated notes
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user+exercise lookups
CREATE INDEX IF NOT EXISTS idx_form_logs_user_exercise ON public.form_logs(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_form_logs_created_at ON public.form_logs(created_at DESC);

-- RLS
ALTER TABLE public.form_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "form_logs_user_read" ON public.form_logs
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own logs
CREATE POLICY "form_logs_user_insert" ON public.form_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete their own logs
CREATE POLICY "form_logs_user_delete" ON public.form_logs
  FOR DELETE USING (user_id = auth.uid());
