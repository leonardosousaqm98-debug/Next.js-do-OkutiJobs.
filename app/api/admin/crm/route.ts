import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isOkutiCrmEmail } from "@/lib/supabase/crm-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getCrmApiContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { response: NextResponse.json({ error: "configuration" }, { status: 500 }) } as const;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) } as const;
  if (!auth.user.email_confirmed_at || !isOkutiCrmEmail(auth.user.email)) {
    return { response: NextResponse.json({ error: "crm_email_required" }, { status: 403 }) } as const;
  }
  const admin = createSupabaseAdminClient();
  if (!admin) return { response: NextResponse.json({ error: "configuration" }, { status: 500 }) } as const;
  return { admin, user: auth.user } as const;
}

export async function GET() {
  const context = await getCrmApiContext();
  if ("response" in context) return context.response;
  const [{ data: stages, error: stageError }, { data: deals, error: dealError }] = await Promise.all([
    context.admin.from("crm_pipeline_stages").select("id,name,position,color").order("position"),
    context.admin.from("crm_deals").select("id,title,source,estimated_value,currency,description,updated_at,stage_id,company:crm_companies(id,name,industry,province,municipality),contact:crm_contacts(full_name,email,phone)").order("updated_at", { ascending: false }).limit(300),
  ]);
  if (stageError || dealError) return NextResponse.json({ error: "Não foi possível carregar os dados do CRM." }, { status: 503 });
  return NextResponse.json({ stages: stages ?? [], deals: deals ?? [] }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

export async function PATCH(request: Request) {
  const context = await getCrmApiContext();
  if ("response" in context) return context.response;
  const body = await request.json().catch(() => null) as { dealId?: string; stageId?: string; estimatedValue?: number } | null;
  if (!body?.dealId || !body.stageId) return NextResponse.json({ error: "Negócio e etapa são obrigatórios." }, { status: 400 });
  const value = Number(body.estimatedValue);
  const update = { stage_id: body.stageId, ...(Number.isFinite(value) && value >= 0 ? { estimated_value: value } : {}), updated_at: new Date().toISOString() };
  const { error } = await context.admin.from("crm_deals").update(update).eq("id", body.dealId);
  if (error) return NextResponse.json({ error: "Não foi possível actualizar o negócio." }, { status: 400 });
  await context.admin.from("admin_audit_logs").insert({ actor_id: context.user.id, action: "crm_deal_stage_updated", entity_type: "crm_deals", entity_id: body.dealId, metadata: { stageId: body.stageId } });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
