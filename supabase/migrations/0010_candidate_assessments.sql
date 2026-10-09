-- Candidate assessments: language, knowledge and psychometric screening results.
-- Additive migration; results are not used as an automatic rejection criterion.
create table if not exists public.candidate_assessments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  assessment_type text not null check (assessment_type in ('language','knowledge','psychometric')),
  language_code text,
  score integer not null check (score between 0 and 100),
  level text,
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  unique(candidate_id, assessment_type, language_code)
);
create index if not exists candidate_assessments_candidate_idx on public.candidate_assessments(candidate_id, completed_at desc);
alter table public.candidate_assessments enable row level security;
create policy "candidates manage own assessments" on public.candidate_assessments for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "companies read assessments for applications" on public.candidate_assessments for select using (
  exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id where a.candidate_id = candidate_assessments.candidate_id and j.company_id = auth.uid())
);
