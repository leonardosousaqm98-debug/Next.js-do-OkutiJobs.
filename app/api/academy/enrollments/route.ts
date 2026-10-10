import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Serviço OkutiAcademy indisponível." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão para se inscrever." }, { status: 401 });
  const body = await request.json().catch(() => null) as { courseId?: unknown; cohortId?: unknown } | null;
  const courseId = typeof body?.courseId === "string" ? body.courseId : "";
  const cohortId = typeof body?.cohortId === "string" && body.cohortId ? body.cohortId : null;
  if (!/^[0-9a-f-]{36}$/i.test(courseId) || (cohortId && !/^[0-9a-f-]{36}$/i.test(cohortId))) return NextResponse.json({ error: "Curso ou turma inválidos." }, { status: 400 });
  const { data, error } = await supabase.rpc("academy_enrol", { p_course_id: courseId, p_cohort_id: cohortId });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "28000" ? 401 : error.code === "P0002" ? 404 : error.code === "23514" ? 409 : 503;
    return NextResponse.json({ error: error.message || "Não foi possível concluir a inscrição." }, { status });
  }
  const response = data as { alreadyEnrolled?: boolean } | null;
  return NextResponse.json(data, { status: response?.alreadyEnrolled ? 200 : 201 });
}
