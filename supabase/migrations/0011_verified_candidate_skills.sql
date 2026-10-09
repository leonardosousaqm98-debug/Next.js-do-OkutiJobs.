create table if not exists public.candidate_skills (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  name text not null,
  declared_level text not null default 'Intermédio',
  status text not null default 'pending' check (status in ('pending','verified','failed')),
  verified_at timestamptz,
  next_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(candidate_id, name)
);
create table if not exists public.skill_tests (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.candidate_skills(id) on delete cascade,
  level text not null,
  duration_seconds integer not null default 300,
  created_at timestamptz not null default now()
);
create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.skill_tests(id) on delete cascade,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  correct_option integer not null check (correct_option >= 0),
  position integer not null
);
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.candidate_skills(id) on delete cascade,
  test_id uuid not null references public.skill_tests(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  passed boolean not null,
  answers jsonb not null default '{}'::jsonb,
  duration_seconds integer not null default 0,
  tab_switches integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists candidate_skills_candidate_idx on public.candidate_skills(candidate_id, status);
create index if not exists test_attempts_skill_idx on public.test_attempts(skill_id, created_at desc);
alter table public.candidate_skills enable row level security;
alter table public.skill_tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;
create policy "candidate manages own skills" on public.candidate_skills for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "candidate reads own tests" on public.skill_tests for select using (exists (select 1 from public.candidate_skills s where s.id = skill_tests.skill_id and s.candidate_id = auth.uid()));
create policy "candidate reads own questions" on public.test_questions for select using (exists (select 1 from public.skill_tests t join public.candidate_skills s on s.id = t.skill_id where t.id = test_questions.test_id and s.candidate_id = auth.uid()));
create policy "candidate manages own attempts" on public.test_attempts for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "companies read verified skills for applications" on public.candidate_skills for select using (status = 'verified' and exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id where a.candidate_id = candidate_skills.candidate_id and j.company_id = auth.uid()));
