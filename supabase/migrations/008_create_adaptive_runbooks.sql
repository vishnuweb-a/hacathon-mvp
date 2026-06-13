-- Migration: Create adaptive_runbooks and runbook_step_metrics tables
-- Adaptive Runbook Intelligence Engine

-- Table 1: Stores generated adaptive runbooks as JSONB per threat type
CREATE TABLE IF NOT EXISTS public.adaptive_runbooks (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    threat_type      TEXT        NOT NULL,
    runbook          JSONB       NOT NULL,
    confidence_score NUMERIC     NOT NULL DEFAULT 0,
    generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adaptive_runbooks_threat_type
    ON public.adaptive_runbooks (threat_type);

CREATE INDEX idx_adaptive_runbooks_generated_at
    ON public.adaptive_runbooks (generated_at DESC);

ALTER TABLE public.adaptive_runbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on adaptive_runbooks"
    ON public.adaptive_runbooks
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Table 2: Stores per-step metrics for effectiveness analysis
CREATE TABLE IF NOT EXISTS public.runbook_step_metrics (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    threat_type             TEXT        NOT NULL,
    step_name               TEXT        NOT NULL,
    occurrences             INTEGER     NOT NULL DEFAULT 0,
    success_rate            NUMERIC     NOT NULL DEFAULT 0,
    average_resolution_time INTEGER     NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_runbook_step_metrics_threat_type
    ON public.runbook_step_metrics (threat_type);

ALTER TABLE public.runbook_step_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on runbook_step_metrics"
    ON public.runbook_step_metrics
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
