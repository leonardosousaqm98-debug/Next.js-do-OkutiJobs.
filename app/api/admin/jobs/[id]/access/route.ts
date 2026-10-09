import { NextResponse } from "next/server";
import { getAdminApiContext } from "@/lib/supabase/admin-api";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAdminApiContext();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({})) as { extraDays?: number };
  const extraDays = Math.min(365, Math.max(1, Math.floor(Number(body.extraDays ?? 30))));
  const { id } = await context.params;
  const { data: job, error: readError } = await auth.admin.from("jobs").select("id,admin_access_until").eq("id", id).maybeSingle();
  if (readError || !job) return NextResponse.json({ error: "Vaga não encontrada." }, { status: 404 });
  const base = job.admin_access_until && new Date(job.admin_access_until) > new Date() ? new Date(job.admin_access_until) : new Date();
  const adminAccessUntil = new Date(base.getTime() + extraDays * 86400000).toISOString();
  const { error } = await auth.admin.from("jobs").update({ admin_access_until: adminAccessUntil }).eq("id", id);
  if (error) return NextResponse.json({ error: "Não foi possível conceder o tempo extra." }, { status: 500 });
  await auth.admin.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "extend_job_candidate_access", entity_type: "jobs", entity_id: id, metadata: { extraDays, adminAccessUntil } });
  return NextResponse.json({ ok: true, adminAccessUntil, extraDays });
}
