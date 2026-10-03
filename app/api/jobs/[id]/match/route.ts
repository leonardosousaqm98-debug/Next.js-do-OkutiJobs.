import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runJobMatching } from "@/lib/job-matching-notifications";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Configuração Supabase incompleta." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const { id } = await context.params;
  const { data: job } = await supabase.from("jobs").select("id,company_id,status").eq("id", id).maybeSingle();
  if (!job || job.company_id !== auth.user.id) return NextResponse.json({ error: "Vaga não encontrada ou sem autorização." }, { status: 403 });
  if (job.status !== "published") return NextResponse.json({ error: "As notificações só são enviadas para vagas publicadas." }, { status: 400 });
  try { return NextResponse.json({ ok: true, ...(await runJobMatching(id)) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível executar o matching." }, { status: 500 }); }
}
