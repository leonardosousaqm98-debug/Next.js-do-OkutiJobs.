-- OkutiJobs: níveis de acesso administrativo e catálogo gerível de formações
alter table public.admin_members
  add column if not exists role text not null default 'moderator'
  check (role in ('principal','moderator'));

-- O proprietário inicial mantém controlo total; restantes membros começam como moderadores.
update public.admin_members
set role = 'principal'
where user_id = (select id from auth.users where lower(email) = 'leonardosousaqm98@gmail.com');

create table if not exists public.training_courses (
  slug text primary key,
  title text not null,
  area text not null,
  level text not null,
  mode text not null,
  duration text not null,
  price text not null,
  estimated_date text not null,
  schedule text not null,
  description text not null,
  outcomes jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_courses enable row level security;
create policy "public reads active training courses" on public.training_courses
  for select to anon, authenticated using (active = true or public.is_platform_admin());
create policy "admins manage training courses" on public.training_courses
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create index if not exists training_courses_active_idx on public.training_courses(active, featured, title);
