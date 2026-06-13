-- Migration: Create threat_intelligence_reports table for the Threat Pattern Detection Engine
-- Stores Gemini-generated intelligence reports as JSONB for flexible schema evolution

CREATE TABLE IF NOT EXISTS public.threat_intelligence_reports (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    report     JSONB       NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast latest-report retrieval
CREATE INDEX idx_threat_intelligence_reports_created_at
    ON public.threat_intelligence_reports (created_at DESC);

-- Enable RLS
ALTER TABLE public.threat_intelligence_reports ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon/authenticated (Phase 1 - no auth)
CREATE POLICY "Allow all operations on threat_intelligence_reports"
    ON public.threat_intelligence_reports
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
