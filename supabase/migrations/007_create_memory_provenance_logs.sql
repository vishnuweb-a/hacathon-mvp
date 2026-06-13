-- Migration: Create memory_provenance_logs table for the Memory Provenance Explorer
-- Tracks relationships between source records and AI-generated outputs

CREATE TABLE IF NOT EXISTS public.memory_provenance_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT        NOT NULL,  -- 'incident' | 'postmortem' | 'learning_event' | 'memory' | 'analysis'
    source_id   TEXT        NOT NULL,
    target_type TEXT        NOT NULL,  -- 'recommendation' | 'analysis' | 'report' | 'intelligence' | 'copilot_response'
    target_id   TEXT        NOT NULL,
    relevance   FLOAT       DEFAULT 0, -- 0-1 relevance score
    context     TEXT,                  -- optional snippet of matched text
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by target
CREATE INDEX idx_provenance_target
    ON public.memory_provenance_logs (target_type, target_id);

-- Index for fast lookups by source
CREATE INDEX idx_provenance_source
    ON public.memory_provenance_logs (source_type, source_id);

-- Index for timeline queries
CREATE INDEX idx_provenance_created_at
    ON public.memory_provenance_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.memory_provenance_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon/authenticated (Phase 1 - no auth)
CREATE POLICY "Allow all operations on memory_provenance_logs"
    ON public.memory_provenance_logs
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
