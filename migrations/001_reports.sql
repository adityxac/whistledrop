-- WhistleDrop — PostgreSQL schema for Supabase.
-- Run this in Supabase SQL Editor before deploying the API.
create extension if not exists pgcrypto;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  case_code_hash text not null unique,
  category text not null check (category in ('security','harassment','corruption','technical','other')),
  description text not null check (char_length(description) between 20 and 5000),
  evidence_url text,
  status text not null default 'SUBMITTED'
    check (status in ('SUBMITTED','UNDER_REVIEW','RESOLVED','DISMISSED')),
  status_update text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists reports_category_created_idx on public.reports (category, created_at desc);

-- Deny direct anon/authenticated table access. API uses the service role key server-side only.
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant all on public.reports to service_role;

-- Optional history for moderator status changes; contains no reporter identity fields.
create table if not exists public.report_updates (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  status text not null check (status in ('SUBMITTED','UNDER_REVIEW','RESOLVED','DISMISSED')),
  public_update text not null default '' check (char_length(public_update) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists report_updates_report_created_idx on public.report_updates(report_id, created_at desc);
alter table public.report_updates enable row level security;
revoke all on public.report_updates from anon, authenticated;
grant all on public.report_updates to service_role;
