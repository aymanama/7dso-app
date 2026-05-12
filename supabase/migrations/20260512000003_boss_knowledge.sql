-- supabase/migrations/20260512000003_boss_knowledge.sql
ALTER TABLE bosses
  ADD COLUMN IF NOT EXISTS content_order  INT    NOT NULL DEFAULT 99,
  ADD COLUMN IF NOT EXISTS mechanics      TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS min_gear_score INT    NOT NULL DEFAULT 0;
