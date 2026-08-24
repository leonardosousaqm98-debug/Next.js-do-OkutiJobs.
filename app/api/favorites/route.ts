import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const { data, error } = await supabase.from("talent_favorites").select("id,candidate_id,notes,tags,created_at,updated_at").eq("company_id", auth.user.id).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível carregar os favoritos." }, { status: 500 });
  return NextResponse.json({ favorites: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const body = await request.json().catch(() => null) as { candidateId?: string; notes?: string; tags?: string[] } | null;
  if (!body?.candidateId) return NextResponse.json({ error: "Candidato obrigatório." }, { status: 400 });
  const { data, error } = await supabase.from("talent_favorites").upsert({ company_id: auth.user.id, candidate_id: body.candidateId, notes: body.notes?.trim() || null, tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : [] }, { onConflict: "company_id,candidate_id" }).select("id,candidate_id,notes,tags,created_at,updated_at").single();
  if (error) return NextResponse.json({ error: "Não foi possível guardar o favorito." }, { status: 500 });
  return NextResponse.json({ favorite: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const candidateId = new URL(request.url).searchParams.get("candidateId");
  if (!candidateId) return NextResponse.json({ error: "Candidato obrigatório." }, { status: 400 });
  const { error } = await supabase.from("talent_favorites").delete().eq("company_id", auth.user.id).eq("candidate_id", candidateId);
  if (error) return NextResponse.json({ error: "Não foi possível remover o favorito." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
