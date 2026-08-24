import { NextResponse } from "next/server";
import { getAdminApiContext } from "@/lib/supabase/admin-api";

export async function POST() {
  try {
    const context = await getAdminApiContext();
    if ("response" in context) return context.response;
    const { data: expired, error } = await context.admin.from("jobs").update({ status: "expired" }).eq("status", "published").not("expires_at", "is", null).lte("expires_at", new Date().toISOString()).select("id,company_id,title");
    if (error) return NextResponse.json({ error: "expiry_failed" }, { status: 500 });
    if (expired?.length) {
      const notifications = expired.map((job) => ({ user_id: job.company_id, kind: "job_expired", title: "Uma vaga expirou", body: `A vaga “${job.title}” foi marcada como expirada.`, href: `/empresa` }));
      await context.admin.from("notifications").insert(notifications);
      await context.admin.from("admin_audit_logs").insert({ actor_id: context.user.id, action: "expire_jobs", entity_type: "jobs", metadata: { count: expired.length, job_ids: expired.map((job) => job.id) } });
    }
    return NextResponse.json({ ok: true, expired: expired?.length ?? 0 });
  } catch {
    return NextResponse.json({ error: "expiry_request_failed" }, { status: 400 });
  }
}
