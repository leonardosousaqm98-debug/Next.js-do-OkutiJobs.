import { NextResponse } from "next/server";
import { getAdminApiContext } from "@/lib/supabase/admin-api";

export async function GET() {
  const context = await getAdminApiContext();
  if ("response" in context) return context.response;
  const [{ data: stages, error: stageError }, { data: deals, error: dealError }] = await Promise.all([
    context.admin.from("crm_pipeline_stages").select("id,name,position,color").order("position"),
    context.admin.from("crm_deals").select("id,title,source,estimated_value,currency,description,updated_at,stage_id,company:crm_companies(id,name,industry,province,municipality),contact:crm_contacts(full_name,email,phone)").order("updated_at", { ascending: false }).limit(300),
  ]);
  if (stageError || dealError) return NextResponse.json({ error: "O módulo CRM ainda não está disponível. Execute a migração 0012 no Supabase." }, { status: 503 });
  return NextResponse.json({ stages: stages ?? [], deals: deals ?? [], role: "admin" });
}

export async function PATCH(request: Request) {
  const context = await getAdminApiContext();
  if ("response" in context) return context.response;
  const body = await request.json().catch(() => null) as { dealId?: string; stageId?: string; estimatedValue?: number } | null;
  if (!body?.dealId || !body.stageId) return NextResponse.json({ error: "Negócio e etapa são obrigatórios." }, { status: 400 });
  const value = Number(body.estimatedValue);
  const update = { stage_id: body.stageId, ...(Number.isFinite(value) && value >= 0 ? { estimated_value: value } : {}), updated_at: new Date().toISOString() };
  const { error } = await context.admin.from("crm_deals").update(update).eq("id", body.dealId);
  if (error) return NextResponse.json({ error: "Não foi possível mover o negócio." }, { status: 400 });
  await context.admin.from("admin_audit_logs").insert({ actor_id: context.user.id, action: "crm_deal_stage_updated", entity_type: "crm_deals", entity_id: body.dealId, metadata: { stageId: body.stageId } });
  return NextResponse.json({ ok: true });
}
