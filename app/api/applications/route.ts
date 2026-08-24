import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidJobId } from "@/lib/supabase/application-validation";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão para se candidatar." }, { status: 401 });
  const body = await request.json().catch(() => null) as { jobId?: string } | null;
  if (!isValidJobId(body?.jobId)) return NextResponse.json({ error: "Vaga inválida." }, { status: 400 });
  const { error } = await supabase.from("applications").insert({ job_id: body.jobId, candidate_id: auth.user.id });
  if (error?.code === "23505") return NextResponse.json({ error: "Já se candidatou a esta vaga." }, { status: 409 });
  if (error) return NextResponse.json({ error: "Não foi possível registar a candidatura." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão para consultar as suas candidaturas." }, { status: 401 });
  const { data, error } = await supabase.from("applications").select("id,job_id,status,created_at,jobs(title,city,province,work_mode,company_id)").eq("candidate_id", auth.user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível carregar as candidaturas." }, { status: 500 });
  const rows = (data ?? []) as Array<{ id: string; job_id: string; status: string; created_at: string; jobs: { title: string; city: string | null; province: string | null; work_mode: string | null; company_id: string } | { title: string; city: string | null; province: string | null; work_mode: string | null; company_id: string }[] | null }>;
  const companyIds = Array.from(new Set(rows.map((row) => Array.isArray(row.jobs) ? row.jobs[0]?.company_id : row.jobs?.company_id).filter(Boolean) as string[]));
  const { data: companies } = companyIds.length ? await supabase.from("public_company_profiles").select("id,name").in("id", companyIds) : { data: [] as Array<{ id: string; name: string }> };
  const companyMap = new Map((companies ?? []).map((company) => [company.id, company.name]));
  const applications = rows.map((row) => { const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs; return { ...row, jobs: job ? { ...job, company_profiles: { name: companyMap.get(job.company_id) || "Empresa" } } : null }; });
  return NextResponse.json({ applications });
}
