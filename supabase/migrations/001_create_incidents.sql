-- Supabase SQL: Run this in the Supabase SQL Editor to create the incidents table
-- Dashboard → SQL Editor → New query → paste → Run

CREATE TABLE IF NOT EXISTS incidents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  severity    TEXT        NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status      TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: enable Row Level Security (can be loosened for Phase 1 testing)
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (Phase 1 - no auth)
CREATE POLICY "Allow all operations on incidents"
  ON incidents
  FOR ALL
  USING (true)
  WITH CHECK (true);
