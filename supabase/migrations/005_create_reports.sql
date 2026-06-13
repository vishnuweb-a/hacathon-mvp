-- Migration: Create reports table
create table reports (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id) on delete cascade,
  report_content jsonb not null,
  created_at timestamp with time zone default now()
);

-- Index for fast lookups by incident
create index idx_reports_incident_id on reports(incident_id);
