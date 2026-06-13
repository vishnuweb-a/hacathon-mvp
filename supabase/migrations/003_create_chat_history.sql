-- Create chat_history table
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (allow public access for this MVP, similar to other tables if needed, or secure it)
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for anon/authenticated (adjust as per your security model)
CREATE POLICY "Allow all operations for anon" ON public.chat_history
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
