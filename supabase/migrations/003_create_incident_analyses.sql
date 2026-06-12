-- Migration: 003_create_incident_analyses
-- Create the incident_analyses table to store AI-generated analysis results.

create table incident_analyses (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id) on delete cascade,
  root_cause text,
  confidence integer,
  recommended_actions jsonb,
  estimated_resolution_time text,
  recommended_runbook text,
  analysis_summary text,
  created_at timestamp default now()
);

-- Enable Row Level Security
alter table incident_analyses enable row level security;
create policy "Allow all" on incident_analyses for all using (true) with check (true);
