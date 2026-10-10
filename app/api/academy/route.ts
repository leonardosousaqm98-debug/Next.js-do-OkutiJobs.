import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Serviço OkutiAcademy indisponível." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão para abrir a OkutiAcademy." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("account_type,full_name").eq("id", auth.user.id).maybeSingle();
  if (profile?.account_type !== "candidate") return NextResponse.json({ error: "A OkutiAcademy para alunos está disponível em contas de candidato." }, { status: 403 });

  const { data: courses, error: courseError } = await supabase.from("academy_courses")
    .select("id,slug,title,summary,category,level,competency_key,estimated_minutes,cover_url")
    .eq("is_published", true).order("category").order("title");
  if (courseError) return NextResponse.json({ error: "A migration da OkutiAcademy ainda não está activa no Supabase." }, { status: 503 });

  const courseIds = (courses ?? []).map((course) => course.id);
  const [{ data: enrollments }, { data: certificates }, { data: recommendations }, { data: badges }, { data: leaderboard }, { data: settings }] = await Promise.all([
    supabase.from("academy_enrollments").select("id,course_id,cohort_id,status,xp_points,enrolled_at,completed_at").eq("user_id", auth.user.id).order("enrolled_at", { ascending: false }),
    supabase.from("academy_certificates").select("id,course_id,course_title,verification_code,integrity_hash,issued_at,status,anchor_network,anchor_tx_hash,anchored_at").eq("user_id", auth.user.id).order("issued_at", { ascending: false }),
    supabase.from("academy_recommendations").select("id,skill_id,course_id,reason,status,created_at").eq("user_id", auth.user.id).eq("status", "new").order("created_at", { ascending: false }).limit(12),
    supabase.from("academy_learner_badges").select("awarded_at,badge:academy_badges(slug,name,description,icon,xp_threshold)").eq("user_id", auth.user.id).order("awarded_at", { ascending: false }),
    supabase.rpc("get_academy_leaderboard"),
    supabase.from("academy_learner_settings").select("public_display_name,leaderboard_opt_in").eq("user_id", auth.user.id).maybeSingle(),
  ]);

  const allCourseIds = [...new Set([...(courseIds), ...((enrollments ?? []).map((item) => item.course_id))])];
  const [{ data: lessons }, { data: progress }, { data: cohorts }, { data: skills }] = await Promise.all([
    allCourseIds.length ? supabase.from("academy_lessons").select("id,course_id,title,content_kind,media_url,low_bandwidth_url,transcript,text_content,duration_seconds,asset_bytes,position").in("course_id", allCourseIds).order("position") : Promise.resolve({ data: [] }),
    supabase.from("academy_lesson_progress").select("lesson_id,status,progress_percent,seconds_spent,completed_at").eq("user_id", auth.user.id),
    supabase.from("academy_cohorts").select("id,course_id,title,starts_at,ends_at,modality,status,capacity").eq("status", "open").order("starts_at"),
    (recommendations ?? []).length ? supabase.from("candidate_skills").select("id,name").in("id", (recommendations ?? []).map((item) => item.skill_id).filter(Boolean)) : Promise.resolve({ data: [] }),
  ]);
  const courseById = new Map((courses ?? []).map((course) => [course.id, course]));
  const skillById = new Map((skills ?? []).map((skill) => [skill.id, skill.name]));
  const enrollmentByCourse = new Map((enrollments ?? []).map((enrollment) => [enrollment.course_id, enrollment]));
  const totalXp = (enrollments ?? []).reduce((total, enrollment) => total + (enrollment.xp_points ?? 0), 0);

  return NextResponse.json({
    learner: { name: profile.full_name || auth.user.email || "Aprendiz", email: auth.user.email ?? "", totalXp },
    courses: (courses ?? []).map((course) => ({
      ...course,
      lessons: (lessons ?? []).filter((lesson) => lesson.course_id === course.id),
      enrollment: enrollmentByCourse.get(course.id) ?? null,
      openCohorts: (cohorts ?? []).filter((cohort) => cohort.course_id === course.id),
    })),
    enrollments: enrollments ?? [],
    progress: progress ?? [],
    recommendations: (recommendations ?? []).map((item) => ({ ...item, course: courseById.get(item.course_id) ?? null, skillName: skillById.get(item.skill_id) ?? "competência" })),
    certificates: certificates ?? [],
    badges: badges ?? [],
    leaderboard: leaderboard ?? [],
    preferences: settings ?? { public_display_name: "", leaderboard_opt_in: false },
  });
}
