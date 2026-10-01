-- Dados adicionais para o perfil empresarial completo.
alter table public.company_profiles add column if not exists legal_name text;
alter table public.company_profiles add column if not exists address text;
alter table public.company_profiles add column if not exists contact_phone text;
alter table public.company_profiles add column if not exists contact_email text;
alter table public.company_profiles add column if not exists employee_count integer;
alter table public.company_profiles add column if not exists company_size text;
alter table public.company_profiles add column if not exists founded_year integer;
alter table public.company_profiles add column if not exists linkedin_url text;
alter table public.company_profiles add column if not exists profile_completeness integer not null default 0 check (profile_completeness between 0 and 100);
