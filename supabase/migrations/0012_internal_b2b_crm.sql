create table if not exists public.crm_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position integer not null,
  color text not null default 'teal',
  created_at timestamptz not null default now()
);
insert into public.crm_pipeline_stages (name, position, color) values
 ('Nova lead / Pedido', 1, 'teal'), ('Contacto efectuado', 2, 'blue'), ('Proposta enviada', 3, 'gold'), ('Negociação', 4, 'lilac'), ('Fechado / Ganho', 5, 'green'), ('Perdido', 6, 'red')
on conflict (name) do nothing;
create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid unique references public.company_profiles(id) on delete set null,
  name text not null,
  legal_name text,
  nif text,
  industry text,
  size text,
  country text,
  province text,
  municipality text,
  address text,
  website text,
  owner_id uuid references auth.users(id) on delete set null,
  status text not null default 'lead' check (status in ('lead','active','inactive','customer')),
  source text not null default 'company_signup',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  crm_company_id uuid not null references public.crm_companies(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role_title text,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  crm_company_id uuid not null references public.crm_companies(id) on delete cascade,
  stage_id uuid not null references public.crm_pipeline_stages(id),
  title text not null,
  source text not null default 'manual',
  estimated_value numeric(14,2) not null default 0,
  currency text not null default 'AOA',
  description text,
  expected_close_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  crm_company_id uuid not null references public.crm_companies(id) on delete cascade,
  deal_id uuid references public.crm_deals(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  activity_type text not null check (activity_type in ('call','email','meeting','note','proposal','invoice')),
  subject text not null,
  body text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists public.crm_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  segment text not null default 'all',
  status text not null default 'draft' check (status in ('draft','scheduled','sending','sent','cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipients_count integer not null default 0,
  opened_count integer not null default 0,
  clicked_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_deals_stage_idx on public.crm_deals(stage_id, updated_at desc);
create index if not exists crm_activities_company_idx on public.crm_activities(crm_company_id, occurred_at desc);

create or replace function public.crm_sync_company_profile() returns trigger language plpgsql security definer set search_path = public as $$
declare company_record uuid; stage_record uuid;
begin
  insert into public.crm_companies (company_id,name,legal_name,nif,industry,size,country,province,municipality,address,website,source,updated_at)
  values (new.id,coalesce(new.name,'Empresa sem nome'),new.legal_name,new.nif,new.industry,new.company_size,new.country,new.province,new.municipality,new.address,new.website_url,'company_signup',now())
  on conflict (company_id) do update set name=excluded.name,legal_name=excluded.legal_name,nif=excluded.nif,industry=excluded.industry,size=excluded.size,country=excluded.country,province=excluded.province,municipality=excluded.municipality,address=excluded.address,website=excluded.website,updated_at=now()
  returning id into company_record;
  select id into stage_record from public.crm_pipeline_stages where position=1 limit 1;
  if tg_op='INSERT' then insert into public.crm_deals(crm_company_id,stage_id,title,source,description) values(company_record,stage_record,'Nova conta empresarial','company_signup','Empresa registada na plataforma OkutiJobs.') on conflict do nothing; end if;
  return new;
end; $$;
drop trigger if exists crm_company_profile_sync on public.company_profiles;
create trigger crm_company_profile_sync after insert or update on public.company_profiles for each row execute function public.crm_sync_company_profile();

alter table public.crm_pipeline_stages enable row level security;
alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_campaigns enable row level security;
create policy "crm staff stages" on public.crm_pipeline_stages for all using (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active')) with check (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active'));
create policy "crm staff companies" on public.crm_companies for all using (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active')) with check (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active'));
create policy "crm staff contacts" on public.crm_contacts for all using (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active')) with check (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active'));
create policy "crm staff deals" on public.crm_deals for all using (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active')) with check (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active'));
create policy "crm staff activities" on public.crm_activities for all using (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active')) with check (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active'));
create policy "crm staff campaigns" on public.crm_campaigns for all using (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active')) with check (exists(select 1 from public.admin_members m where m.user_id=auth.uid() and m.status='active'));
