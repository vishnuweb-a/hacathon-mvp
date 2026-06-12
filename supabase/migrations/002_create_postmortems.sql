-- Supabase SQL: Run this in the Supabase SQL Editor to create the postmortems table

CREATE TABLE IF NOT EXISTS postmortems (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id             UUID        NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  root_cause              TEXT        NOT NULL,
  resolution              TEXT        NOT NULL,
  lessons_learned         TEXT        NOT NULL,
  resolution_time_minutes INTEGER     NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(incident_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE postmortems ENABLE ROW LEVEL SECURITY;

-- Allow all operations for Phase 2
CREATE POLICY "Allow all operations on postmortems"
  ON postmortems
  FOR ALL
  USING (true)
  WITH CHECK (true);
