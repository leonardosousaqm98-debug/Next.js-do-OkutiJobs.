import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Serviço OkutiAcademy indisponível." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão para guardar o progresso." }, { status: 401 });
  const body = await request.json().catch(() => null) as { action?: unknown; lessonId?: unknown; secondsSpent?: unknown } | null;
  const lessonId = typeof body?.lessonId === "string" ? body.lessonId : "";
  const action = body?.action === "start" ? "start" : "complete";
  const secondsSpent = Number(body?.secondsSpent ?? 0);
  if (!/^[0-9a-f-]{36}$/i.test(lessonId) || !Number.isFinite(secondsSpent) || secondsSpent < 0) return NextResponse.json({ error: "Dados de progresso inválidos." }, { status: 400 });
  const { data, error } = action === "start"
    ? await supabase.rpc("start_academy_lesson", { p_lesson_id: lessonId })
    : await supabase.rpc("complete_academy_lesson", { p_lesson_id: lessonId, p_seconds_spent: Math.min(300, Math.floor(secondsSpent)) });
  if (error) {
    console.error(`academy lesson ${action} failed`, { code: error.code, message: error.message });
    const status = error.code === "42501" ? 403 : error.code === "28000" ? 401 : error.code === "23514" ? 409 : 503;
    return NextResponse.json({ error: error.message || "Não foi possível registar o progresso da aula." }, { status });
  }
  return NextResponse.json(data);
}
