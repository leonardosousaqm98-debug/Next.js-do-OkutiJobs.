import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const types = new Set(["language", "knowledge", "psychometric"]);
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Serviço de avaliações indisponível." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão como candidato." }, { status: 401 });
  const body = await request.json().catch(() => null) as { assessmentType?: unknown; languageCode?: unknown; score?: unknown; level?: unknown; answers?: unknown } | null;
  const assessmentType = String(body?.assessmentType ?? "");
  const languageCode = body?.languageCode ? String(body.languageCode).slice(0, 12) : null;
  const score = Number(body?.score);
  if (!types.has(assessmentType) || !Number.isInteger(score) || score < 0 || score > 100 || (assessmentType === "language" && !languageCode)) return NextResponse.json({ error: "Resultado de avaliação inválido." }, { status: 400 });
  const answers = body?.answers && typeof body.answers === "object" ? body.answers : {};
  const { error } = await supabase.from("candidate_assessments").upsert({ candidate_id: auth.user.id, assessment_type: assessmentType, language_code: languageCode, score, level: String(body?.level ?? "").slice(0, 40) || null, answers }, { onConflict: "candidate_id,assessment_type,language_code" });
  if (error) { console.error("candidate assessment upsert failed", { code: error.code, message: error.message }); return NextResponse.json({ error: "Não foi possível guardar o resultado. Confirme se a migração de avaliações foi aplicada." }, { status: 503 }); }
  return NextResponse.json({ ok: true, score, level: body?.level ?? null }, { status: 201 });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
  const { data, error } = await supabase.from("candidate_assessments").select("id,assessment_type,language_code,score,level,completed_at").eq("candidate_id", auth.user.id).order("completed_at", { ascending: false });
  if (error) return NextResponse.json({ assessments: [] });
  return NextResponse.json({ assessments: data ?? [] });
}
