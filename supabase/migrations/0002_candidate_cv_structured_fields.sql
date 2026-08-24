-- Additive migration for international candidate CV sections.
-- Safe to run after 0001_okutijobs_foundation.sql.
alter table public.candidate_profiles
  add column if not exists experience jsonb not null default '[]'::jsonb,
  add column if not exists education jsonb not null default '[]'::jsonb,
  add column if not exists skills jsonb not null default '[]'::jsonb,
  add column if not exists portfolio_url text;
