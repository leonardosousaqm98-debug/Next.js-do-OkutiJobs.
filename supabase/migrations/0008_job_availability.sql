-- Campos de publicação usados pelo formulário estruturado de vagas.
alter table public.jobs add column if not exists availability text;
create index if not exists jobs_availability_idx on public.jobs (availability);
