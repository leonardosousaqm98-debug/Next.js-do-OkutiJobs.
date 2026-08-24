create extension if not exists "pgcrypto";

create type public.account_type as enum ('candidate', 'company');
create type public.profile_visibility as enum ('public', 'private');
create type public.job_status as enum ('draft', 'published', 'closed', 'expired');
create type public.application_status as enum ('submitted', 'screening', 'interview', 'offer', 'accepted', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  account_type public.account_type not null default 'candidate',
  preferred_language text not null default 'pt',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidate_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  headline text,
  bio text,
  country text,
  province text,
  municipality text,
  city text,
  preferred_work_mode text,
  contract_type text,
  academic_level text,
  study_field text,
  current_title text,
  salary_min_kz numeric,
  salary_max_kz numeric,
  availability text,
  willing_to_relocate boolean not null default false,
  willing_to_travel boolean not null default false,
  open_to_work boolean not null default true,
  visibility public.profile_visibility not null default 'private',
  profile_completeness integer not null default 0 check (profile_completeness between 0 and 100),
  certifications jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.company_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  nif text,
  description text,
  industry text,
  website_url text,
  country text,
  province text,
  municipality text,
  city text,
  logo_path text,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text not null,
  requirements text,
  country text,
  province text,
  city text,
  work_mode text,
  contract_type text,
  status public.job_status not null default 'draft',
  publication_mode text not null default 'public',
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  status public.application_status not null default 'submitted',
  created_at timestamptz not null default now(),
  unique(job_id, candidate_id)
);

create table public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  document_type text not null default 'cv',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.candidate_documents enable row level security;

create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users create own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "public candidates are visible" on public.candidate_profiles for select using (visibility = 'public' and open_to_work = true or auth.uid() = id);
create policy "candidates manage own profile" on public.candidate_profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "public companies are visible through jobs" on public.company_profiles for select using (true);
create policy "company owners manage company" on public.company_profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "published jobs are public" on public.jobs for select using (status = 'published' or company_id = auth.uid());
create policy "company owners manage jobs" on public.jobs for all using (company_id = auth.uid()) with check (company_id = auth.uid());
create policy "candidates manage own applications" on public.applications for select using (candidate_id = auth.uid());
create policy "companies read applications to own jobs" on public.applications for select using (exists (select 1 from public.jobs where jobs.id = job_id and jobs.company_id = auth.uid()));
create policy "candidates create own applications" on public.applications for insert with check (candidate_id = auth.uid());
create policy "candidates manage own documents" on public.candidate_documents for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('candidate-documents', 'candidate-documents', false, 10485760, array['application/pdf']::text[])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

create policy "candidates upload own CVs" on storage.objects for insert to authenticated
with check (bucket_id = 'candidate-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "candidates read own CVs" on storage.objects for select to authenticated
using (bucket_id = 'candidate-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "candidates update own CVs" on storage.objects for update to authenticated
using (bucket_id = 'candidate-documents' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'candidate-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "candidates delete own CVs" on storage.objects for delete to authenticated
using (bucket_id = 'candidate-documents' and (storage.foldername(name))[1] = auth.uid()::text);
