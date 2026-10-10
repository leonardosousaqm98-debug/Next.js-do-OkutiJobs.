-- OkutiAcademy: micro-learning, turmas, progresso, recomendações, gamificação e certificados verificáveis.
-- Migration aditiva. A emissão usa SHA-256 verificável; ancoragem on-chain é opcional/futura.
create extension if not exists pgcrypto;

create table public.academy_instructors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_title text not null default 'Instrutor OkutiAcademy',
  active boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.academy_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  category text not null default 'Competências profissionais',
  level text not null default 'Fundamentos',
  competency_key text,
  estimated_minutes integer not null default 15 check (estimated_minutes between 3 and 600),
  cover_url text,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academy_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  title text not null,
  content_kind text not null default 'text' check (content_kind in ('video','audio','text')),
  media_url text,
  low_bandwidth_url text,
  transcript text,
  text_content text not null default '',
  duration_seconds integer not null check (duration_seconds between 180 and 300),
  asset_bytes bigint check (asset_bytes is null or asset_bytes >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique(course_id, position)
);

create table public.academy_cohorts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  instructor_id uuid not null references public.academy_instructors(user_id) on delete restrict,
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  modality text not null default 'Online' check (modality in ('Online','Presencial','Híbrido')),
  status text not null default 'open' check (status in ('draft','open','in_progress','completed','archived')),
  capacity integer check (capacity is null or capacity between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  cohort_id uuid references public.academy_cohorts(id) on delete set null,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  xp_points integer not null default 0 check (xp_points >= 0),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, course_id)
);

create table public.academy_lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  enrollment_id uuid not null references public.academy_enrollments(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  seconds_spent integer not null default 0 check (seconds_spent >= 0),
  started_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key(user_id, lesson_id)
);

create table public.academy_certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references public.academy_enrollments(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  course_id uuid not null references public.academy_courses(id) on delete restrict,
  learner_display_name text not null,
  course_title text not null,
  verification_code text not null unique,
  integrity_hash text not null check (integrity_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'issued' check (status in ('issued','revoked')),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revocation_reason text,
  anchor_network text,
  anchor_tx_hash text,
  anchored_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.academy_skill_course_rules (
  id uuid primary key default gen_random_uuid(),
  skill_pattern text not null,
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  priority integer not null default 100,
  active boolean not null default true,
  unique(skill_pattern, course_id)
);

create table public.academy_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid references public.candidate_skills(id) on delete set null,
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  reason text not null default 'Resultado abaixo da nota de aprovação na validação de competências.',
  status text not null default 'new' check (status in ('new','viewed','enrolled','dismissed')),
  created_at timestamptz not null default now(),
  unique(attempt_id, course_id)
);

create table public.academy_badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null default '✦',
  xp_threshold integer not null default 0 check (xp_threshold >= 0)
);

create table public.academy_learner_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.academy_badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key(user_id, badge_id)
);

create table public.academy_learner_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  public_display_name text,
  leaderboard_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

create index academy_courses_catalog_idx on public.academy_courses(is_published, category, title);
create index academy_lessons_course_idx on public.academy_lessons(course_id, position);
create index academy_cohorts_instructor_idx on public.academy_cohorts(instructor_id, status, starts_at);
create index academy_enrollments_user_idx on public.academy_enrollments(user_id, status, enrolled_at desc);
create index academy_enrollments_cohort_idx on public.academy_enrollments(cohort_id) where cohort_id is not null;
create index academy_progress_enrollment_idx on public.academy_lesson_progress(enrollment_id, status);
create index academy_recommendations_user_idx on public.academy_recommendations(user_id, status, created_at desc);
create index academy_certificates_user_idx on public.academy_certificates(user_id, issued_at desc);

create or replace function public.academy_is_instructor()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.academy_instructors i
    where i.user_id = auth.uid() and i.active = true
  );
$$;

create or replace function public.academy_is_enrolled_in_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.academy_enrollments e where e.user_id = auth.uid() and e.course_id = p_course_id); $$;

create or replace function public.academy_teaches_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select public.academy_is_instructor() and (
  exists (select 1 from public.academy_courses c where c.id = p_course_id and c.created_by = auth.uid())
  or exists (select 1 from public.academy_cohorts c where c.course_id = p_course_id and c.instructor_id = auth.uid())
); $$;

create or replace function public.academy_can_read_cohort(p_cohort_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.academy_cohorts c where c.id = p_cohort_id and (c.status <> 'draft' or c.instructor_id = auth.uid()))
  or exists (select 1 from public.academy_enrollments e where e.cohort_id = p_cohort_id and e.user_id = auth.uid()); $$;

create or replace function public.academy_teaches_cohort(p_cohort_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select public.academy_is_instructor() and exists (select 1 from public.academy_cohorts c where c.id = p_cohort_id and c.instructor_id = auth.uid()); $$;

create or replace function public.academy_teaches_enrollment(p_enrollment_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select public.academy_is_instructor() and exists (
  select 1 from public.academy_enrollments e join public.academy_cohorts c on c.id = e.cohort_id
  where e.id = p_enrollment_id and c.instructor_id = auth.uid()
); $$;

revoke all on function public.academy_is_instructor() from public;
revoke all on function public.academy_is_enrolled_in_course(uuid) from public;
revoke all on function public.academy_teaches_course(uuid) from public;
revoke all on function public.academy_can_read_cohort(uuid) from public;
revoke all on function public.academy_teaches_cohort(uuid) from public;
revoke all on function public.academy_teaches_enrollment(uuid) from public;
grant execute on function public.academy_is_instructor() to authenticated;
grant execute on function public.academy_is_enrolled_in_course(uuid) to authenticated;
grant execute on function public.academy_teaches_course(uuid) to anon, authenticated;
grant execute on function public.academy_can_read_cohort(uuid) to authenticated;
grant execute on function public.academy_teaches_cohort(uuid) to authenticated;
grant execute on function public.academy_teaches_enrollment(uuid) to authenticated;

alter table public.academy_instructors enable row level security;
alter table public.academy_courses enable row level security;
alter table public.academy_lessons enable row level security;
alter table public.academy_cohorts enable row level security;
alter table public.academy_enrollments enable row level security;
alter table public.academy_lesson_progress enable row level security;
alter table public.academy_certificates enable row level security;
alter table public.academy_skill_course_rules enable row level security;
alter table public.academy_recommendations enable row level security;
alter table public.academy_badges enable row level security;
alter table public.academy_learner_badges enable row level security;
alter table public.academy_learner_settings enable row level security;

create policy "instructors read their own academy status" on public.academy_instructors for select to authenticated using (user_id = auth.uid());
create policy "public reads published academy courses" on public.academy_courses for select to anon, authenticated using (is_published or created_by = auth.uid() or public.academy_teaches_course(id));
create policy "instructors create academy courses" on public.academy_courses for insert to authenticated with check (created_by = auth.uid() and public.academy_is_instructor());
create policy "course authors update academy courses" on public.academy_courses for update to authenticated using (created_by = auth.uid() and public.academy_is_instructor()) with check (created_by = auth.uid() and public.academy_is_instructor());
create policy "students or assigned instructors read lessons" on public.academy_lessons for select to authenticated using (
  exists (select 1 from public.academy_courses c where c.id = academy_lessons.course_id and c.is_published)
  or public.academy_is_enrolled_in_course(course_id)
  or public.academy_teaches_course(course_id)
);
create policy "instructors manage lessons for assigned courses" on public.academy_lessons for all to authenticated using (
  public.academy_teaches_course(course_id)
) with check (
  public.academy_teaches_course(course_id)
);
create policy "users read their cohorts and instructors manage theirs" on public.academy_cohorts for select to authenticated using (public.academy_can_read_cohort(id));
create policy "active instructors create their cohorts" on public.academy_cohorts for insert to authenticated with check (instructor_id = auth.uid() and public.academy_is_instructor());
create policy "active instructors update their cohorts" on public.academy_cohorts for update to authenticated using (instructor_id = auth.uid() and public.academy_is_instructor()) with check (instructor_id = auth.uid() and public.academy_is_instructor());
create policy "students and assigned instructors read enrollments" on public.academy_enrollments for select to authenticated using (user_id = auth.uid() or public.academy_teaches_cohort(cohort_id));
create policy "learners and assigned instructors read progress" on public.academy_lesson_progress for select to authenticated using (
  user_id = auth.uid() or public.academy_teaches_enrollment(enrollment_id)
);
create policy "learners and assigned instructors read certificates" on public.academy_certificates for select to authenticated using (
  user_id = auth.uid() or public.academy_teaches_enrollment(enrollment_id)
);
create policy "all users read badge definitions" on public.academy_badges for select to anon, authenticated using (true);
create policy "learners read own badges" on public.academy_learner_badges for select to authenticated using (user_id = auth.uid());
create policy "learners read their recommendations" on public.academy_recommendations for select to authenticated using (user_id = auth.uid());
create policy "learners update own recommendations" on public.academy_recommendations for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users read their academy preferences" on public.academy_learner_settings for select to authenticated using (user_id = auth.uid());
create policy "users manage their academy preferences" on public.academy_learner_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Do not add a SELECT policy to profiles for instructors: RLS filters rows, not columns.
-- This narrow RPC returns only a learner UUID and display name for the caller's own cohorts.
create or replace function public.academy_instructor_learners(p_cohort_ids uuid[])
returns table (learner_id uuid, learner_name text)
language sql stable security definer
set search_path = public, pg_temp
as $$
  select distinct e.user_id as learner_id,
    coalesce(nullif(trim(p.full_name), ''), 'Aprendiz') as learner_name
  from public.academy_enrollments e
  join public.academy_cohorts c on c.id = e.cohort_id
  join public.profiles p on p.id = e.user_id
  where auth.uid() is not null
    and public.academy_is_instructor()
    and p_cohort_ids is not null
    and cardinality(p_cohort_ids) between 1 and 1000
    and e.cohort_id = any(p_cohort_ids)
    and c.instructor_id = auth.uid()
    and e.status <> 'cancelled';
$$;
revoke all on function public.academy_instructor_learners(uuid[]) from public, anon, authenticated;
grant execute on function public.academy_instructor_learners(uuid[]) to authenticated;

create or replace function public.academy_certificate_hash(
  p_verification_code text, p_user_id uuid, p_course_id uuid,
  p_course_title text, p_learner_name text, p_issued_at timestamptz
) returns text
language sql immutable
set search_path = public, extensions, pg_temp
as $$
  select encode(digest(
    jsonb_build_array(
      'okutiacademy-certificate-v1', p_verification_code, p_user_id,
      p_course_id, p_course_title, p_learner_name,
      to_char(p_issued_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
    )::text, 'sha256'
  ), 'hex');
$$;
revoke all on function public.academy_certificate_hash(text, uuid, uuid, text, text, timestamptz) from public, anon, authenticated;

create or replace function public.academy_enrol(p_course_id uuid, p_cohort_id uuid default null)
returns jsonb language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_course public.academy_courses%rowtype;
  v_cohort public.academy_cohorts%rowtype;
  v_existing public.academy_enrollments%rowtype;
  v_enrollment public.academy_enrollments%rowtype;
  v_count integer;
begin
  if v_user_id is null then raise exception 'Inicie sessão para se inscrever.' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_user_id and p.account_type = 'candidate') then
    raise exception 'As inscrições estão disponíveis apenas para candidatos.' using errcode = '42501';
  end if;
  select * into v_course from public.academy_courses where id = p_course_id and is_published = true;
  if not found then raise exception 'Este curso já não está disponível.' using errcode = 'P0002'; end if;
  if p_cohort_id is not null then
    select * into v_cohort from public.academy_cohorts where id = p_cohort_id for update;
    if not found or v_cohort.course_id <> p_course_id or v_cohort.status <> 'open' then
      raise exception 'Esta turma não está aberta para inscrições.' using errcode = '23514';
    end if;
    if v_cohort.capacity is not null then
      select count(*) into v_count from public.academy_enrollments e where e.cohort_id = p_cohort_id and e.status <> 'cancelled';
      if v_count >= v_cohort.capacity then raise exception 'Esta turma já atingiu a capacidade máxima.' using errcode = '23514'; end if;
    end if;
  end if;
  select * into v_existing from public.academy_enrollments where user_id = v_user_id and course_id = p_course_id;
  if found then return jsonb_build_object('enrollment', to_jsonb(v_existing), 'alreadyEnrolled', true); end if;
  insert into public.academy_enrollments(user_id,course_id,cohort_id)
  values (v_user_id,p_course_id,p_cohort_id) returning * into v_enrollment;
  return jsonb_build_object('enrollment', to_jsonb(v_enrollment), 'alreadyEnrolled', false);
end;
$$;
revoke all on function public.academy_enrol(uuid, uuid) from public;
grant execute on function public.academy_enrol(uuid, uuid) to authenticated;

create or replace function public.start_academy_lesson(p_lesson_id uuid)
returns jsonb language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_lesson public.academy_lessons%rowtype;
  v_enrollment public.academy_enrollments%rowtype;
  v_progress public.academy_lesson_progress%rowtype;
  v_min_seconds integer;
begin
  if v_user_id is null then raise exception 'Inicie sessão para abrir esta aula.' using errcode = '28000'; end if;
  select * into v_lesson from public.academy_lessons where id = p_lesson_id;
  if not found then raise exception 'Aula não encontrada.' using errcode = 'P0002'; end if;
  select * into v_enrollment from public.academy_enrollments
    where user_id = v_user_id and course_id = v_lesson.course_id and status in ('active','completed');
  if not found then raise exception 'Inscreva-se no curso antes de abrir uma aula.' using errcode = '42501'; end if;
  v_min_seconds := greatest(60, ceil(v_lesson.duration_seconds * 0.5)::integer);
  insert into public.academy_lesson_progress(user_id,lesson_id,enrollment_id,status,progress_percent,seconds_spent,started_at,last_accessed_at)
    values (v_user_id,p_lesson_id,v_enrollment.id,'in_progress',0,0,now(),now())
    on conflict (user_id,lesson_id) do update set last_accessed_at=now()
      where public.academy_lesson_progress.status <> 'completed'
    returning * into v_progress;
  if not found then
    select * into v_progress from public.academy_lesson_progress where user_id=v_user_id and lesson_id=p_lesson_id;
  end if;
  return jsonb_build_object('started_at',v_progress.started_at,'completed',v_progress.status='completed','min_seconds',v_min_seconds);
end;
$$;
revoke all on function public.start_academy_lesson(uuid) from public;
grant execute on function public.start_academy_lesson(uuid) to authenticated;

create or replace function public.complete_academy_lesson(p_lesson_id uuid, p_seconds_spent integer default 0)
returns jsonb
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_lesson public.academy_lessons%rowtype;
  v_enrollment public.academy_enrollments%rowtype;
  v_was_complete boolean := false;
  v_started_at timestamptz;
  v_min_seconds integer;
  v_completed_count integer := 0;
  v_total_count integer := 0;
  v_xp integer := 0;
  v_badges jsonb := '[]'::jsonb;
  v_certificate public.academy_certificates%rowtype;
  v_learner_name text;
  v_code text;
  v_issued_at timestamptz;
begin
  if v_user_id is null then raise exception 'Inicie sessão para registar o progresso.' using errcode = '28000'; end if;
  select * into v_lesson from public.academy_lessons where id = p_lesson_id;
  if not found then raise exception 'Aula não encontrada.' using errcode = 'P0002'; end if;
  select * into v_enrollment from public.academy_enrollments
   where user_id = v_user_id and course_id = v_lesson.course_id and status in ('active','completed')
   for update;
  if not found then raise exception 'Inscreva-se no curso antes de concluir uma aula.' using errcode = '42501'; end if;
  select status = 'completed', started_at into v_was_complete, v_started_at
    from public.academy_lesson_progress where user_id = v_user_id and lesson_id = p_lesson_id;
  if v_started_at is null then raise exception 'Abra a aula para iniciar o tempo mínimo de aprendizagem.' using errcode = '23514'; end if;
  v_min_seconds := greatest(60, ceil(v_lesson.duration_seconds * 0.5)::integer);
  if not v_was_complete and extract(epoch from (now() - v_started_at)) < v_min_seconds then
    raise exception 'Continue na aula durante pelo menos % segundos antes de a concluir.', v_min_seconds using errcode = '23514';
  end if;
  insert into public.academy_lesson_progress(user_id, lesson_id, enrollment_id, status, progress_percent, seconds_spent, started_at, last_accessed_at, completed_at)
  values (v_user_id, p_lesson_id, v_enrollment.id, 'completed', 100, greatest(coalesce(p_seconds_spent,0),0), now(), now(), now())
  on conflict (user_id, lesson_id) do update set status = 'completed', progress_percent = 100,
    seconds_spent = greatest(public.academy_lesson_progress.seconds_spent, excluded.seconds_spent),
    last_accessed_at = now(), completed_at = coalesce(public.academy_lesson_progress.completed_at, now());
  if not v_was_complete then
    update public.academy_enrollments set xp_points = xp_points + 25 where id = v_enrollment.id returning xp_points into v_xp;
  else
    v_xp := v_enrollment.xp_points;
  end if;
  with awarded as (
    insert into public.academy_learner_badges(user_id, badge_id)
    select v_user_id, b.id from public.academy_badges b
    where b.xp_threshold <= (select coalesce(sum(e.xp_points),0) from public.academy_enrollments e where e.user_id = v_user_id)
    on conflict do nothing returning badge_id
  )
  select coalesce(jsonb_agg(jsonb_build_object('slug',b.slug,'name',b.name,'icon',b.icon)), '[]'::jsonb)
    into v_badges from awarded a join public.academy_badges b on b.id = a.badge_id;
  select count(*) into v_total_count from public.academy_lessons where course_id = v_lesson.course_id;
  select count(*) into v_completed_count from public.academy_lesson_progress p join public.academy_lessons l on l.id = p.lesson_id
    where p.user_id = v_user_id and l.course_id = v_lesson.course_id and p.status = 'completed';
  if v_total_count > 0 and v_completed_count = v_total_count then
    update public.academy_enrollments set status = 'completed', completed_at = coalesce(completed_at, now()) where id = v_enrollment.id;
    select coalesce(nullif(trim(p.full_name),''), 'Aprendiz OkutiJobs') into v_learner_name from public.profiles p where p.id = v_user_id;
    v_learner_name := coalesce(v_learner_name, 'Aprendiz OkutiJobs');
    v_code := encode(gen_random_bytes(16), 'hex');
    v_issued_at := clock_timestamp();
    insert into public.academy_certificates(enrollment_id, user_id, course_id, learner_display_name, course_title, verification_code, integrity_hash, issued_at)
    values (v_enrollment.id, v_user_id, v_lesson.course_id, v_learner_name,
      (select c.title from public.academy_courses c where c.id = v_lesson.course_id), v_code,
      public.academy_certificate_hash(v_code, v_user_id, v_lesson.course_id,
        (select c.title from public.academy_courses c where c.id = v_lesson.course_id), v_learner_name, v_issued_at), v_issued_at)
    on conflict (enrollment_id) do nothing;
    select * into v_certificate from public.academy_certificates where enrollment_id = v_enrollment.id;
  end if;
  return jsonb_build_object(
    'ok', true, 'xp_awarded', case when v_was_complete then 0 else 25 end,
    'total_course_xp', coalesce(v_xp, v_enrollment.xp_points),
    'course_completed', (v_total_count > 0 and v_completed_count = v_total_count),
    'new_badges', v_badges,
    'certificate', case when v_certificate.id is null then null else jsonb_build_object(
      'id', v_certificate.id, 'verification_code', v_certificate.verification_code,
      'integrity_hash', v_certificate.integrity_hash, 'issued_at', v_certificate.issued_at,
      'course_title', v_certificate.course_title, 'learner_display_name', v_certificate.learner_display_name
    ) end
  );
end;
$$;
revoke all on function public.complete_academy_lesson(uuid, integer) from public;
grant execute on function public.complete_academy_lesson(uuid, integer) to authenticated;

create or replace function public.verify_academy_certificate(p_verification_code text)
returns table (
  certificate_number text, learner_display_name text, course_title text,
  issued_at timestamptz, status text, integrity_hash text, integrity_valid boolean,
  anchor_network text, anchor_tx_hash text, anchored_at timestamptz
)
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select 'OKA-' || upper(substr(c.verification_code,1,12)), c.learner_display_name, c.course_title,
    c.issued_at, c.status, c.integrity_hash,
    c.integrity_hash = public.academy_certificate_hash(c.verification_code,c.user_id,c.course_id,c.course_title,c.learner_display_name,c.issued_at),
    c.anchor_network, c.anchor_tx_hash, c.anchored_at
  from public.academy_certificates c
  where c.verification_code = lower(trim(coalesce(p_verification_code,'')))
  limit 1;
$$;
revoke all on function public.verify_academy_certificate(text) from public;
grant execute on function public.verify_academy_certificate(text) to anon, authenticated;

create or replace function public.get_academy_leaderboard()
returns table (rank integer, learner_name text, xp_points bigint)
language sql stable security definer
set search_path = public, pg_temp
as $$
  select row_number() over (order by sum(e.xp_points) desc, min(e.enrolled_at) asc)::integer,
    s.public_display_name, sum(e.xp_points)::bigint
  from public.academy_learner_settings s
  join public.academy_enrollments e on e.user_id = s.user_id
  where s.leaderboard_opt_in = true and nullif(trim(s.public_display_name),'') is not null
  group by s.user_id, s.public_display_name
  order by sum(e.xp_points) desc, min(e.enrolled_at) asc
  limit 10;
$$;
revoke all on function public.get_academy_leaderboard() from public;
grant execute on function public.get_academy_leaderboard() to anon, authenticated;

create or replace function public.academy_suggest_courses_after_failed_test()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if new.passed = false then
    insert into public.academy_recommendations(user_id, skill_id, attempt_id, course_id, reason)
    select new.candidate_id, s.id, new.id, r.course_id,
      'Reforço sugerido após ' || coalesce(s.name,'a validação de competências') || ' (' || new.score::text || '%).'
    from public.candidate_skills s
    join public.academy_skill_course_rules r on r.active = true
    join public.academy_courses c on c.id = r.course_id and c.is_published = true
    where s.id = new.skill_id
      and lower(s.name) like '%' || lower(r.skill_pattern) || '%'
    order by r.priority asc
    on conflict (attempt_id, course_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger academy_failed_skill_test_recommendations
  after insert on public.test_attempts
  for each row execute function public.academy_suggest_courses_after_failed_test();

insert into public.academy_courses(slug,title,summary,category,level,competency_key,estimated_minutes,is_published)
values
  ('iva-na-pratica','IVA na prática','Micro-aulas para reforçar os conceitos essenciais de IVA, documentos fiscais e validação de operações.','Contabilidade e Fiscalidade','Fundamentos','IVA',12,true),
  ('primavera-erp-fundamentos','Primavera ERP: fundamentos','Percurso curto sobre navegação, registos e validação de operações no Primavera ERP.','Software de Gestão','Fundamentos','Primavera',15,true)
on conflict (slug) do update set title=excluded.title, summary=excluded.summary, category=excluded.category,
  level=excluded.level, competency_key=excluded.competency_key, estimated_minutes=excluded.estimated_minutes,
  is_published=excluded.is_published, updated_at=now();

insert into public.academy_lessons(course_id,title,content_kind,text_content,duration_seconds,position)
select c.id, lesson.title, 'text', lesson.body, lesson.duration_seconds, lesson.position
from public.academy_courses c
join (values
  ('iva-na-pratica','O que é o IVA e como se calcula','O Imposto sobre o Valor Acrescentado incide sobre o consumo e é cobrado ao longo da cadeia de fornecimento. Para apurar o valor a entregar, a empresa compara o IVA liquidado nas vendas com o IVA dedutível suportado nas compras elegíveis. A diferença não deve ser tratada como receita: é uma obrigação fiscal que exige registos consistentes. Exemplo simplificado: se uma venda gerar 100 unidades de IVA liquidado e as compras elegíveis gerarem 60 de IVA dedutível, o saldo apurado é 40. Confirme sempre a taxa, o regime e as regras aplicáveis à operação concreta antes de declarar.',240,1),
  ('iva-na-pratica','Factura, recibo e evidências','Cada operação precisa de documentação adequada. Antes de registar um documento, confirme a identificação das partes, a data, os valores, a descrição dos bens ou serviços e a coerência dos cálculos. Evite duplicar documentos e mantenha a ligação entre factura, pagamento e lançamento contabilístico. Se detectar um erro, não apague silenciosamente o registo original: siga o procedimento de correcção e preserve o histórico. Uma boa rotina diária reduz divergências no fecho do período e facilita a revisão por colegas ou auditores. As obrigações exactas variam com o regime fiscal e devem ser confirmadas com um profissional habilitado.',240,2),
  ('iva-na-pratica','Reconciliação e preparação da declaração','No fim do período, reconcilie os documentos de venda e compra com os lançamentos contabilísticos. Separe operações tributadas, isentas e não sujeitas, confira notas de crédito e valide documentos de suporte antes de fechar. Compare os totais do sistema com os mapas de apuramento e investigue diferenças em vez de as ajustar sem evidência. Guarde os comprovativos e uma lista de verificações assinada. Esta aula é educativa e não substitui orientação fiscal: a declaração deve respeitar a legislação angolana em vigor e a situação específica da organização.',300,3),
  ('primavera-erp-fundamentos','Navegar sem perder contexto','Antes de registar movimentos no ERP Primavera, identifique a empresa activa, o exercício e o módulo correcto. Confirme o período de trabalho e consulte os dados de origem, sobretudo quando alternar entre empresas ou séries documentais. Use filtros para localizar registos e verifique o estado de cada documento antes de abrir um novo. Uma rotina simples de confirmação reduz lançamentos na entidade ou período errado. As permissões disponíveis dependem do perfil configurado pela organização; solicite acesso formal quando uma operação estiver bloqueada, em vez de partilhar credenciais.',240,1),
  ('primavera-erp-fundamentos','Registar e validar um documento','Prepare os dados de cabeçalho, seleccione a série aprovada e valide cliente ou fornecedor, datas, artigos/serviços, quantidades e valores. Antes de confirmar, reveja o resumo e compare-o com o documento de origem. Após gravar, confirme se o documento ficou no estado esperado e se a operação produziu os movimentos associados correctos. Se precisar de corrigir, use os fluxos documentados pela equipa financeira; não crie duplicados para contornar uma mensagem de erro. Os nomes dos menus podem variar conforme a versão e os módulos licenciados.',300,2),
  ('primavera-erp-fundamentos','Fecho, pesquisa e controlo','No fecho do trabalho, pesquise os documentos pendentes, confira totais e datas e exporte relatórios apenas para destinos autorizados. Mantenha um registo do período, dos filtros aplicados e das diferenças que ficaram por resolver. Não partilhe dados reais de clientes em ficheiros de formação. Em caso de divergência, reúna o número do documento e o contexto necessário para que o supervisor possa reproduzir a situação. Este percurso introduz boas práticas; a operação deve seguir os procedimentos internos e a versão do Primavera usada pela organização.',300,3)
) as lesson(slug,title,body,duration_seconds,position) on lesson.slug=c.slug
where not exists (select 1 from public.academy_lessons existing where existing.course_id=c.id and existing.position=lesson.position);

insert into public.academy_skill_course_rules(skill_pattern,course_id,priority)
select rules.skill_pattern, c.id, rules.priority
from (values ('IVA','iva-na-pratica',10),('Primavera','primavera-erp-fundamentos',10)) as rules(skill_pattern,slug,priority)
join public.academy_courses c on c.slug=rules.slug
on conflict (skill_pattern,course_id) do update set priority=excluded.priority, active=true;

insert into public.academy_badges(slug,name,description,icon,xp_threshold)
values
  ('primeira-aula','Primeiro passo','Concluiu a primeira micro-aula.','✦',25),
  ('aprendiz-consistente','Aprendiz consistente','Acumulou 100 pontos de aprendizagem.','◆',100),
  ('academia-pro','OkutiAcademy Pro','Acumulou 300 pontos de aprendizagem.','★',300)
on conflict (slug) do update set name=excluded.name, description=excluded.description, icon=excluded.icon, xp_threshold=excluded.xp_threshold;
