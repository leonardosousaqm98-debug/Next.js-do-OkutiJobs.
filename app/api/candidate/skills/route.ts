import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const levels = new Set(["Iniciante", "Intermédio", "Avançado", "Especialista"]);
const clean = (value: unknown, max = 100) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão como candidato." }, { status: 401 });
  const { data, error } = await supabase.from("candidate_skills").select("id,name,declared_level,status,verified_at,next_attempt_at,created_at").eq("candidate_id", auth.user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "A migração de competências ainda não foi activada." }, { status: 503 });
  return NextResponse.json({ skills: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão como candidato." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = clean(body.name);
  const declaredLevel = clean(body.declaredLevel);
  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Indique uma competência válida." }, { status: 400 });
  if (!levels.has(declaredLevel)) return NextResponse.json({ error: "Seleccione o nível declarado." }, { status: 400 });
  const { data, error } = await supabase.from("candidate_skills").upsert({ candidate_id: auth.user.id, name, declared_level: declaredLevel, status: "pending", updated_at: new Date().toISOString() }, { onConflict: "candidate_id,name" }).select("id,name,declared_level,status,verified_at,next_attempt_at,created_at").single();
  if (error) return NextResponse.json({ error: "Não foi possível adicionar a competência." }, { status: 400 });
  return NextResponse.json({ skill: data });
}
