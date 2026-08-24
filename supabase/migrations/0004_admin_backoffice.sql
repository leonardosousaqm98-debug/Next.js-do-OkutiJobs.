-- OkutiJobs: backoffice global, créditos e auditoria
create table if not exists public.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  mfa_enrolled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_members
    where user_id = auth.uid() and status = 'active'
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

alter table public.company_profiles add column if not exists account_status text not null default 'active' check (account_status in ('active','pending','suspended'));
alter table public.candidate_profiles add column if not exists account_status text not null default 'active' check (account_status in ('active','blocked','pending'));
alter table public.candidate_profiles add column if not exists verified_at timestamptz;
alter table public.jobs add column if not exists featured boolean not null default false;
alter table public.jobs add column if not exists expires_at timestamptz;
alter table public.jobs add column if not exists moderation_status text not null default 'approved' check (moderation_status in ('pending','approved','rejected'));
alter table public.jobs add column if not exists moderation_note text;

create table if not exists public.recruitment_proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.company_profiles(id) on delete set null,
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  service text not null,
  positions jsonb not null default '[]'::jsonb,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (status in ('received','in_review','quoted','won','lost','closed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits integer not null check (credits > 0),
  price_kz numeric(14,2) not null check (price_kz >= 0),
  validity_days integer not null default 30 check (validity_days > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_credit_accounts (
  company_id uuid primary key references public.company_profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason text not null,
  reference text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.company_profiles(id) on delete set null,
  amount_kz numeric(14,2) not null check (amount_kz >= 0),
  method text not null check (method in ('multicaixa_express','reference','bank_transfer','card','other')),
  status text not null default 'pending' check (status in ('pending','paid','cancelled','refunded')),
  external_reference text,
  note text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);
create index if not exists admin_audit_logs_entity_idx on public.admin_audit_logs(entity_type, entity_id, created_at desc);
create index if not exists jobs_moderation_status_idx on public.jobs(moderation_status, status, created_at desc);
create index if not exists proposals_status_created_idx on public.recruitment_proposals(status, created_at desc);
create index if not exists payments_status_created_idx on public.payments(status, created_at desc);
create index if not exists credit_ledger_company_created_idx on public.credit_ledger(company_id, created_at desc);

alter table public.admin_members enable row level security;
alter table public.recruitment_proposals enable row level security;
alter table public.credit_packages enable row level security;
alter table public.company_credit_accounts enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.payments enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy "admins manage admin members" on public.admin_members for all to authenticated using (public.is_platform_admin() or user_id = auth.uid()) with check (public.is_platform_admin() or user_id = auth.uid());
create policy "admins manage proposals" on public.recruitment_proposals for all to authenticated using (public.is_platform_admin() or company_id = auth.uid()) with check (public.is_platform_admin() or company_id = auth.uid());
create policy "admins manage credit packages" on public.credit_packages for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "companies read own credit account" on public.company_credit_accounts for select to authenticated using (company_id = auth.uid() or public.is_platform_admin());
create policy "admins manage credit accounts" on public.company_credit_accounts for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "companies read own credit ledger" on public.credit_ledger for select to authenticated using (company_id = auth.uid() or public.is_platform_admin());
create policy "admins manage credit ledger" on public.credit_ledger for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "companies read own payments" on public.payments for select to authenticated using (company_id = auth.uid() or public.is_platform_admin());
create policy "admins manage payments" on public.payments for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins read audit logs" on public.admin_audit_logs for select to authenticated using (public.is_platform_admin());
create policy "admins write audit logs" on public.admin_audit_logs for insert to authenticated with check (public.is_platform_admin() and actor_id = auth.uid());

create or replace function public.admin_expire_jobs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare changed integer;
begin
  update public.jobs
  set status = 'expired'
  where status = 'published'
    and expires_at is not null
    and expires_at <= now();
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke all on function public.admin_expire_jobs() from public;
grant execute on function public.admin_expire_jobs() to service_role;
