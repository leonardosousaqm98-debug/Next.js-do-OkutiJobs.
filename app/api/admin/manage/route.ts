import { NextRequest, NextResponse } from "next/server";
import { getAdminApiContext } from "@/lib/supabase/admin-api";

type Action = "company_status" | "candidate_status" | "job_moderation" | "proposal_status";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed: Record<Action, string[]> = { company_status: ["active", "pending", "suspended"], candidate_status: ["active", "pending", "blocked"], job_moderation: ["pending", "approved", "rejected"], proposal_status: ["received", "in_review", "quoted", "won", "lost", "closed"] };
const tables: Record<Action, { table: string; column: string }> = { company_status: { table: "company_profiles", column: "account_status" }, candidate_status: { table: "candidate_profiles", column: "account_status" }, job_moderation: { table: "jobs", column: "moderation_status" }, proposal_status: { table: "recruitment_proposals", column: "status" } };

export async function POST(request: NextRequest) {
  try {
    const context = await getAdminApiContext();
    if ("response" in context) return context.response;
    const body = await request.json() as { action?: Action; id?: string; value?: string; note?: string };
    if (!body.action || !body.id || !body.value || !uuid.test(body.id) || !allowed[body.action]?.includes(body.value)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const config = tables[body.action];
    const update: Record<string, string> = { [config.column]: body.value };
    if (body.action === "job_moderation" && body.note) update.moderation_note = body.note.slice(0, 2000);
    const { error } = await context.admin.from(config.table).update(update).eq("id", body.id);
    if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });
    const { error: auditError } = await context.admin.from("admin_audit_logs").insert({ actor_id: context.user.id, action: `update_${body.action}`, entity_type: config.table, entity_id: body.id, metadata: { value: body.value, note: body.note?.slice(0, 2000) ?? null } });
    if (auditError) return NextResponse.json({ error: "audit_failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}
