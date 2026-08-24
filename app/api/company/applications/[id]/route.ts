import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const statuses = new Set(["submitted", "screening", "interview", "offer", "accepted", "rejected"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão empresarial necessária." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { status?: string; feedback?: string } | null;
  if (!body?.status || !statuses.has(body.status)) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  const { data: current, error: currentError } = await supabase.from("applications").select("id,candidate_id,status,job:jobs!inner(company_id,title)").eq("id", id).maybeSingle();
  if (currentError || !current) return NextResponse.json({ error: "Candidatura não encontrada." }, { status: 404 });
  const job = Array.isArray(current.job) ? current.job[0] : current.job;
  if (!job || job.company_id !== auth.user.id) return NextResponse.json({ error: "Sem autorização para esta candidatura." }, { status: 403 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Serviço administrativo indisponível." }, { status: 503 });
  const { error: updateError } = await admin.from("applications").update({ status: body.status, company_feedback: body.feedback?.trim() || null, updated_at: new Date().toISOString() }).eq("id", id);
  if (updateError) return NextResponse.json({ error: "Não foi possível actualizar a candidatura." }, { status: 500 });
  const event = await admin.from("application_events").insert({ application_id: id, actor_id: auth.user.id, from_status: current.status, to_status: body.status, note: body.feedback?.trim() || null });
  if (event.error) return NextResponse.json({ error: "Candidatura actualizada, mas o histórico não foi registado." }, { status: 500 });
  await admin.from("notifications").insert({ user_id: current.candidate_id, kind: "application_status", title: "Actualização da candidatura", body: `A sua candidatura para ${job.title} passou para ${body.status}.`, href: `/candidato/candidaturas` });
  return NextResponse.json({ ok: true, status: body.status });
}
