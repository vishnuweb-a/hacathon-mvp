-- Create learning_events table for the Continuous Learning Engine
CREATE TABLE IF NOT EXISTS public.learning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    memory_id TEXT,
    threat_type TEXT,
    knowledge_summary TEXT,
    status TEXT NOT NULL DEFAULT 'completed',  -- completed | pending | failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon/authenticated
CREATE POLICY "Allow all operations for anon" ON public.learning_events
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
