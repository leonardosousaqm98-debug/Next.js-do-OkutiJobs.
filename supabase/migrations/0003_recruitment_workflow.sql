-- OkutiJobs: pipeline, mensagens, notificações e favoritos
alter table public.applications add column if not exists updated_at timestamptz not null default now();
alter table public.applications add column if not exists candidate_note text;
alter table public.applications add column if not exists company_feedback text;

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  body text not null check (char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.talent_favorites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, candidate_id)
);

create index if not exists applications_job_status_idx on public.applications(job_id, status, created_at desc);
create index if not exists application_events_application_idx on public.application_events(application_id, created_at desc);
create index if not exists messages_recipient_created_idx on public.messages(recipient_id, created_at desc);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read_at, created_at desc);
create index if not exists talent_favorites_company_idx on public.talent_favorites(company_id, updated_at desc);

alter table public.application_events enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.talent_favorites enable row level security;

create policy "participants read application events" on public.application_events for select using (
  exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id where a.id = application_id and (a.candidate_id = auth.uid() or j.company_id = auth.uid()))
);
create policy "participants create application events" on public.application_events for insert with check (
  actor_id = auth.uid() and exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id where a.id = application_id and (a.candidate_id = auth.uid() or j.company_id = auth.uid()))
);

create policy "participants read messages" on public.messages for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "users send messages" on public.messages for insert with check (sender_id = auth.uid());
create policy "recipients mark messages read" on public.messages for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "users read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users delete own notifications" on public.notifications for delete using (user_id = auth.uid());

create policy "companies manage own favorites" on public.talent_favorites for all using (company_id = auth.uid()) with check (company_id = auth.uid());

create policy "companies read candidate documents for applications" on public.candidate_documents for select using (
  exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id where a.candidate_id = candidate_documents.candidate_id and j.company_id = auth.uid())
);

drop policy if exists "companies read candidate CV objects for applications" on storage.objects;
create policy "companies read candidate CV objects for applications" on storage.objects for select to authenticated using (
  bucket_id = 'candidate-documents' and exists (
    select 1 from public.candidate_documents d
    join public.applications a on a.candidate_id = d.candidate_id
    join public.jobs j on j.id = a.job_id
    where d.storage_path = name and j.company_id = auth.uid()
  )
);

create policy "companies update applications for own jobs" on public.applications for update using (
  exists (select 1 from public.jobs where jobs.id = job_id and jobs.company_id = auth.uid())
) with check (
  exists (select 1 from public.jobs where jobs.id = job_id and jobs.company_id = auth.uid())
);
create policy "candidates update own applications" on public.applications for update using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
