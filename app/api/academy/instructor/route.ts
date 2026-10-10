import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function instructorContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { response: NextResponse.json({ error: "Serviço OkutiAcademy indisponível." }, { status: 503 }) } as const;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { response: NextResponse.json({ error: "Inicie sessão para abrir a área de instrutor." }, { status: 401 }) } as const;
  const { data: instructor } = await supabase.from("academy_instructors").select("user_id,display_title,active").eq("user_id", auth.user.id).eq("active", true).maybeSingle();
  if (!instructor) return { response: NextResponse.json({ error: "A conta ainda não tem acesso de instrutor aprovado." }, { status: 403 }) } as const;
  return { supabase, user: auth.user, instructor } as const;
}

export async function GET() {
  const context = await instructorContext();
  if ("response" in context) return context.response;
  const { supabase, user, instructor } = context;
  const [{ data: cohorts, error }, { data: catalog }] = await Promise.all([
    supabase.from("academy_cohorts").select("id,course_id,title,starts_at,ends_at,modality,status,capacity,created_at").eq("instructor_id", user.id).order("starts_at", { ascending: true, nullsFirst: false }),
    supabase.from("academy_courses").select("id,title,slug,estimated_minutes").eq("is_published", true).order("title"),
  ]);
  if (error) return NextResponse.json({ error: "Não foi possível carregar as turmas." }, { status: 503 });
  const cohortIds = (cohorts ?? []).map((cohort) => cohort.id);
  const courseIds = [...new Set([...(catalog ?? []).map((course) => course.id), ...(cohorts ?? []).map((cohort) => cohort.course_id)])];
  const [{ data: courses }, { data: enrollments }, { data: lessons }] = await Promise.all([
    courseIds.length ? supabase.from("academy_courses").select("id,title,slug,estimated_minutes").in("id", courseIds) : Promise.resolve({ data: [] }),
    cohortIds.length ? supabase.from("academy_enrollments").select("id,user_id,course_id,cohort_id,status,xp_points,enrolled_at,completed_at").in("cohort_id", cohortIds).neq("status", "cancelled") : Promise.resolve({ data: [] }),
    courseIds.length ? supabase.from("academy_lessons").select("id,course_id").in("course_id", courseIds) : Promise.resolve({ data: [] }),
  ]);
  const enrollmentIds = (enrollments ?? []).map((item) => item.id);
  const [{ data: learnerNames }, { data: progress }, { data: certificates }] = await Promise.all([
    cohortIds.length ? supabase.rpc("academy_instructor_learners", { p_cohort_ids: cohortIds }) : Promise.resolve({ data: [] }),
    enrollmentIds.length ? supabase.from("academy_lesson_progress").select("enrollment_id,lesson_id,status,completed_at").in("enrollment_id", enrollmentIds) : Promise.resolve({ data: [] }),
    enrollmentIds.length ? supabase.from("academy_certificates").select("enrollment_id,verification_code,issued_at,status").in("enrollment_id", enrollmentIds) : Promise.resolve({ data: [] }),
  ]);
  const courseById = new Map((courses ?? []).map((course) => [course.id, course]));
  const learnerNameRows = (learnerNames ?? []) as { learner_id: string; learner_name: string }[];
  const learnerNameById = new Map<string, string>(learnerNameRows.map((learner) => [learner.learner_id, learner.learner_name || "Aprendiz"]));
  const lessonCountByCourse = new Map<string, number>();
  for (const lesson of lessons ?? []) lessonCountByCourse.set(lesson.course_id, (lessonCountByCourse.get(lesson.course_id) ?? 0) + 1);
  return NextResponse.json({
    instructor,
    courses: (catalog ?? []).map((course) => ({ ...course, lessonCount: lessonCountByCourse.get(course.id) ?? 0 })),
    cohorts: (cohorts ?? []).map((cohort) => ({
      ...cohort,
      course: courseById.get(cohort.course_id) ?? null,
      learners: (enrollments ?? []).filter((enrollment) => enrollment.cohort_id === cohort.id).map((enrollment) => {
        const learnerProgress = (progress ?? []).filter((item) => item.enrollment_id === enrollment.id && item.status === "completed");
        const certificate = (certificates ?? []).find((item) => item.enrollment_id === enrollment.id) ?? null;
        return { ...enrollment, learnerName: learnerNameById.get(enrollment.user_id) ?? "Aprendiz", completedLessons: learnerProgress.length, lessonCount: lessonCountByCourse.get(cohort.course_id) ?? 0, certificate };
      }),
    })),
  });
}

export async function POST(request: Request) {
  const context = await instructorContext();
  if ("response" in context) return context.response;
  const { supabase, user } = context;
  const body = await request.json().catch(() => null) as { courseId?: unknown; title?: unknown; startsAt?: unknown; endsAt?: unknown; modality?: unknown; capacity?: unknown } | null;
  const courseId = typeof body?.courseId === "string" ? body.courseId : "";
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 120) : "";
  const modality = typeof body?.modality === "string" ? body.modality : "Online";
  const capacity = body?.capacity === "" || body?.capacity == null ? null : Number(body.capacity);
  if (!/^[0-9a-f-]{36}$/i.test(courseId) || title.length < 3 || !["Online", "Presencial", "Híbrido"].includes(modality) || (capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000))) return NextResponse.json({ error: "Preencha curso, nome da turma, modalidade e capacidade válidos." }, { status: 400 });
  const { data: course } = await supabase.from("academy_courses").select("id").eq("id", courseId).eq("is_published", true).maybeSingle();
  if (!course) return NextResponse.json({ error: "O curso seleccionado não está publicado." }, { status: 404 });
  const parseDate = (value: unknown) => {
    if (typeof value !== "string" || !value) return { date: null as string | null, invalid: false };
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? { date: null, invalid: true } : { date: parsed.toISOString(), invalid: false };
  };
  const start = parseDate(body?.startsAt); const end = parseDate(body?.endsAt);
  if (start.invalid || end.invalid || (start.date && end.date && new Date(end.date) < new Date(start.date))) return NextResponse.json({ error: "Indique datas válidas; a data de fim deve ser posterior ao início." }, { status: 400 });
  const { data: cohort, error } = await supabase.from("academy_cohorts").insert({ course_id: courseId, instructor_id: user.id, title, starts_at: start.date, ends_at: end.date, modality, capacity, status: "open" }).select("id,title,status,starts_at,ends_at,modality,capacity,course_id").single();
  if (error || !cohort) return NextResponse.json({ error: "Não foi possível criar a turma." }, { status: 503 });
  return NextResponse.json({ cohort }, { status: 201 });
}
