-- Additive migration for candidate talent search and salary preferences.
-- Run after 0002_candidate_cv_structured_fields.sql.
alter table public.candidate_profiles
  add column if not exists desired_job_title text,
  add column if not exists seniority_level text,
  add column if not exists functional_areas jsonb not null default '[]'::jsonb,
  add column if not exists salary_currency text not null default 'AOA',
  add column if not exists salary_min_amount numeric,
  add column if not exists salary_max_amount numeric,
  add column if not exists salary_period text not null default 'monthly';
