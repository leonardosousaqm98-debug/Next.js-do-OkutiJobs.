import { NextRequest, NextResponse } from "next/server";
import { getAdminApiContext } from "@/lib/supabase/admin-api";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (value: unknown, max = 200) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET(request: NextRequest) {
  const context = await getAdminApiContext();
  if ("response" in context) return context.response;
  const type = request.nextUrl.searchParams.get("type") === "companies" ? "companies" : "candidates";
  const table = type === "companies" ? "company_profiles" : "candidate_profiles";
  const select = type === "companies" ? "id,name,slug,industry,country,province,city,account_status,verified_at,updated_at" : "id,current_title,headline,country,province,city,account_status,profile_completeness,updated_at,profiles(full_name)";
  const { data, error } = await context.admin.from(table).select(select).order("updated_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: "list_failed" }, { status: 500 });
  const ids = (data ?? []).map((row) => row.id);
  const users = new Map<string, { email?: string; last_sign_in_at?: string; created_at?: string }>();
  if (ids.length) {
    const listed = await context.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const user of listed.data.users ?? []) if (ids.includes(user.id)) users.set(user.id, { email: user.email, last_sign_in_at: user.last_sign_in_at ?? undefined, created_at: user.created_at });
  }
  return NextResponse.json({ type, rows: (data ?? []).map((row) => ({ ...row, user: users.get(row.id) ?? {} })) });
}

export async function POST(request: NextRequest) {
  try {
    const context = await getAdminApiContext();
    if ("response" in context) return context.response;
    const body = await request.json() as { action?: string; id?: string; type?: string; name?: string; headline?: string; status?: string; password?: string; title?: string; message?: string; amount?: number };
    if (!body.id || !uuid.test(body.id) || !body.action) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const type = body.type === "company" ? "company" : "candidate";
    const table = type === "company" ? "company_profiles" : "candidate_profiles";
    if (body.action === "update") {
      const update = type === "company" ? { name: text(body.name, 160), industry: text(body.headline, 120), updated_at: new Date().toISOString() } : { headline: text(body.headline, 160), updated_at: new Date().toISOString() };
      const { error } = await context.admin.from(table).update(update).eq("id", body.id);
      if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });
    } else if (body.action === "status") {
      const allowed = type === "company" ? ["active", "pending", "suspended"] : ["active", "pending", "blocked"];
      if (!body.status || !allowed.includes(body.status)) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
      const { error } = await context.admin.from(table).update({ account_status: body.status, updated_at: new Date().toISOString() }).eq("id", body.id);
      if (error) return NextResponse.json({ error: "status_failed" }, { status: 500 });
    } else if (body.action === "password") {
      if (!body.password || body.password.length < 8) return NextResponse.json({ error: "password_min_8" }, { status: 400 });
      const { error } = await context.admin.auth.admin.updateUserById(body.id, { password: body.password });
      if (error) return NextResponse.json({ error: "password_failed" }, { status: 500 });
    } else if (body.action === "notify") {
      if (!body.title || !body.message) return NextResponse.json({ error: "notification_required" }, { status: 400 });
      const { error } = await context.admin.from("notifications").insert({ user_id: body.id, kind: "admin_message", title: text(body.title, 120), body: text(body.message, 1000), href: type === "company" ? "/empresa" : "/candidato" });
      if (error) return NextResponse.json({ error: "notification_failed" }, { status: 500 });
    } else if (body.action === "proposal") {
      if (!body.title) return NextResponse.json({ error: "proposal_required" }, { status: 400 });
      const { data: profile } = await context.admin.from("profiles").select("full_name").eq("id", body.id).maybeSingle();
      const { data: authUser } = await context.admin.auth.admin.getUserById(body.id);
      const proposal = { requester_name: profile?.full_name ?? "Utilizador", requester_email: authUser.user?.email ?? "sem-email@okutijobs.com", service: text(body.title, 160), status: "received", ...(type === "company" ? { company_id: body.id } : {}) };
      const { error } = await context.admin.from("recruitment_proposals").insert(proposal);
      if (error) return NextResponse.json({ error: "proposal_failed" }, { status: 500 });
    } else if (body.action === "credits") {
      if (type !== "company" || !Number.isInteger(body.amount) || Number(body.amount) <= 0 || Number(body.amount) > 100000) return NextResponse.json({ error: "invalid_credits" }, { status: 400 });
      const { data: current } = await context.admin.from("company_credit_accounts").select("balance").eq("company_id", body.id).maybeSingle();
      const balance = Number(current?.balance ?? 0) + Number(body.amount);
      const { error } = await context.admin.from("company_credit_accounts").upsert({ company_id: body.id, balance, updated_at: new Date().toISOString() });
      if (error) return NextResponse.json({ error: "credits_failed" }, { status: 500 });
      await context.admin.from("credit_ledger").insert({ company_id: body.id, amount: Number(body.amount), reason: "admin_grant", actor_id: context.user.id, reference: "super_admin" });
    } else if (body.action === "delete") {
      const { error } = await context.admin.auth.admin.deleteUser(body.id);
      if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    } else return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
    await context.admin.from("admin_audit_logs").insert({ actor_id: context.user.id, action: `people_${body.action}`, entity_type: table, entity_id: body.id, metadata: { type } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "invalid_request" }, { status: 400 }); }
}
