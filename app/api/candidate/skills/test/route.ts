import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bank = [
  { prompt: (s: string) => `Qual abordagem demonstra domínio profissional de ${s}?`, options: ["Aplicar o conceito, validar o resultado e documentar o processo.", "Ignorar os requisitos e improvisar.", "Usar sempre a primeira solução sem testar.", "Delegar sem acompanhar."], correct: 0 },
  { prompt: (s: string) => `Ao resolver um problema de ${s}, qual é o primeiro passo recomendado?`, options: ["Compreender o contexto e os critérios de sucesso.", "Apagar os dados existentes.", "Escolher uma resposta ao acaso.", "Evitar confirmar os requisitos."], correct: 0 },
  { prompt: (s: string) => `Qual resultado é uma evidência verificável de competência em ${s}?`, options: ["Um resultado reproduzível com contexto e impacto descrito.", "Apenas afirmar que conhece o tema.", "Uma opinião sem exemplo.", "Um certificado sem relação com a prática."], correct: 0 },
  { prompt: (s: string) => `Uma boa prática em ${s} é:`, options: ["Respeitar procedimentos, segurança e qualidade.", "Eliminar revisões.", "Ocultar limitações.", "Trabalhar sem critérios."], correct: 0 },
  { prompt: (s: string) => `Quando surge uma situação nova em ${s}, o profissional deve:`, options: ["Analisar, pedir clarificação quando necessário e justificar a decisão.", "Inventar dados.", "Parar sem comunicar.", "Repetir uma solução inadequada."], correct: 0 },
];
const clean = (value: unknown, max = 100) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão como candidato." }, { status: 401 });
  const skillId = new URL(request.url).searchParams.get("skillId") || "";
  const { data: skill } = await supabase.from("candidate_skills").select("id,name,declared_level,status,next_attempt_at").eq("id", skillId).eq("candidate_id", auth.user.id).maybeSingle();
  if (!skill) return NextResponse.json({ error: "Competência não encontrada." }, { status: 404 });
  if (skill.status === "verified") return NextResponse.json({ error: "Esta competência já está verificada." }, { status: 409 });
  if (skill.next_attempt_at && new Date(skill.next_attempt_at).getTime() > Date.now()) return NextResponse.json({ error: `Pode repetir o teste a partir de ${new Date(skill.next_attempt_at).toLocaleDateString("pt-PT")}.` }, { status: 429 });
  const { data: test, error } = await supabase.from("skill_tests").insert({ skill_id: skill.id, level: skill.declared_level, duration_seconds: 300 }).select("id,duration_seconds").single();
  if (error || !test) return NextResponse.json({ error: "Não foi possível preparar o teste." }, { status: 503 });
  const questions = bank.map((item, position) => ({ test_id: test.id, prompt: item.prompt(skill.name), options: item.options, correct_option: item.correct, position }));
  const { data: saved, error: questionError } = await supabase.from("test_questions").insert(questions).select("id,prompt,options,position").order("position");
  if (questionError) return NextResponse.json({ error: "Não foi possível preparar as perguntas." }, { status: 503 });
  return NextResponse.json({ test: { id: test.id, skillId: skill.id, skillName: skill.name, level: skill.declared_level, durationSeconds: 300 }, questions: saved ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão como candidato." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const testId = clean(body.testId, 80); const answers = Array.isArray(body.answers) ? body.answers.map((x: unknown) => Number(x)) : [];
  const durationSeconds = Math.max(0, Math.min(300, Number(body.durationSeconds) || 0)); const tabSwitches = Math.max(0, Math.min(50, Number(body.tabSwitches) || 0));
  const { data: test } = await supabase.from("skill_tests").select("id,skill_id,skill:candidate_skills!inner(id,candidate_id)").eq("id", testId).eq("skill.candidate_id", auth.user.id).maybeSingle();
  if (!test) return NextResponse.json({ error: "Teste inválido ou expirado." }, { status: 404 });
  const { data: questions } = await supabase.from("test_questions").select("id,correct_option,position").eq("test_id", testId).order("position");
  if (!questions?.length) return NextResponse.json({ error: "O teste não tem perguntas." }, { status: 400 });
  const correct = questions.reduce((total, question, index) => total + (answers[index] === question.correct_option ? 1 : 0), 0);
  const score = Math.round(correct / questions.length * 100); const passed = score >= 70;
  const nextAttempt = passed ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { error: attemptError } = await supabase.from("test_attempts").insert({ skill_id: test.skill_id, test_id: test.id, candidate_id: auth.user.id, score, passed, answers, duration_seconds: durationSeconds, tab_switches: tabSwitches });
  if (attemptError) return NextResponse.json({ error: "Não foi possível guardar a tentativa." }, { status: 503 });
  const { error: skillError } = await supabase.from("candidate_skills").update({ status: passed ? "verified" : "failed", verified_at: passed ? new Date().toISOString() : null, next_attempt_at: nextAttempt, updated_at: new Date().toISOString() }).eq("id", test.skill_id).eq("candidate_id", auth.user.id);
  if (skillError) return NextResponse.json({ error: "Resultado guardado, mas não foi possível actualizar o selo." }, { status: 503 });
  return NextResponse.json({ score, passed, status: passed ? "verified" : "failed", message: passed ? "Competência verificada com sucesso." : "Ainda não atingiu 70%. Pode repetir o teste após 14 dias." });
}
