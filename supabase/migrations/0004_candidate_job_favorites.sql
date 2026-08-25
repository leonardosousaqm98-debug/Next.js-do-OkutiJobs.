-- Candidate job favourites: additive and safe for existing installations.
create table if not exists public.candidate_job_favorites (
  candidate_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (candidate_id, job_id)
);

create index if not exists candidate_job_favorites_candidate_idx
  on public.candidate_job_favorites(candidate_id, created_at desc);

alter table public.candidate_job_favorites enable row level security;

 drop policy if exists "Candidates can read their job favourites" on public.candidate_job_favorites;
create policy "Candidates can read their job favourites"
  on public.candidate_job_favorites for select
  using (auth.uid() = candidate_id);

 drop policy if exists "Candidates can add their job favourites" on public.candidate_job_favorites;
create policy "Candidates can add their job favourites"
  on public.candidate_job_favorites for insert
  with check (auth.uid() = candidate_id);

 drop policy if exists "Candidates can remove their job favourites" on public.candidate_job_favorites;
create policy "Candidates can remove their job favourites"
  on public.candidate_job_favorites for delete
  using (auth.uid() = candidate_id);
