-- Ciclo de vida da vaga: 30 dias de candidaturas + 60 dias de gestão empresarial.
alter table public.jobs
  add column if not exists candidate_access_until timestamptz,
  add column if not exists admin_access_until timestamptz;

create index if not exists jobs_candidate_access_until_idx
  on public.jobs(candidate_access_until);

create index if not exists jobs_admin_access_until_idx
  on public.jobs(admin_access_until);

-- Vagas antigas publicadas passam a ter uma janela segura calculada a partir da publicação.
update public.jobs
set candidate_access_until = coalesce(candidate_access_until, coalesce(published_at, created_at) + interval '30 days'),
    admin_access_until = coalesce(admin_access_until, coalesce(published_at, created_at) + interval '90 days')
where status in ('published','expired','closed');

-- Apenas vagas dentro da janela pública são visíveis como publicadas.
drop policy if exists "published jobs are public" on public.jobs;
create policy "published jobs are public" on public.jobs for select using (
  (status = 'published' and (candidate_access_until is null or candidate_access_until > now()))
  or company_id = auth.uid()
  or exists (select 1 from public.admin_members m where m.user_id = auth.uid() and m.status = 'active')
);
