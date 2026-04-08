-- =============================================================================
-- Migration 018: Add form_rules column to exercises
-- =============================================================================
-- Stores AI-generated form checking rules as JSONB.
-- Schema: { rules: [{ landmarks: [number, number, number], min: number, max: number, cue: string }] }
-- =============================================================================

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS form_rules JSONB;
