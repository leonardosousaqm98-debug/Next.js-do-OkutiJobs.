import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getSession() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: auth } = await supabase.auth.getUser();
  return { supabase, user: auth.user };
}

export async function GET() {
  const { supabase, user } = await getSession();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const { data, error } = await supabase.from("candidate_job_favorites").select("job_id,created_at").eq("candidate_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Favoritos ainda não estão disponíveis nesta instalação." }, { status: 503 });
  return NextResponse.json({ favorites: (data ?? []).map((item) => item.job_id) });
}

export async function POST(request: Request) {
  const { supabase, user } = await getSession();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const body = await request.json().catch(() => null) as { jobId?: string } | null;
  if (!body?.jobId || body.jobId.length > 120) return NextResponse.json({ error: "Vaga inválida." }, { status: 400 });
  const { error } = await supabase.from("candidate_job_favorites").upsert({ candidate_id: user.id, job_id: body.jobId }, { onConflict: "candidate_id,job_id" });
  if (error) return NextResponse.json({ error: "Não foi possível guardar a vaga." }, { status: 503 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getSession();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "Vaga inválida." }, { status: 400 });
  const { error } = await supabase.from("candidate_job_favorites").delete().eq("candidate_id", user.id).eq("job_id", jobId);
  if (error) return NextResponse.json({ error: "Não foi possível remover a vaga." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
