import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function context() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data: member } = await admin.from("admin_members").select("user_id,role,status").eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
  return member ? { admin, user: auth.user, member } : null;
}

export async function GET() {
  const current = await context();
  if (!current) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const [{ data: users }, { data: courses }] = await Promise.all([
    current.admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    current.admin.from("training_courses").select("slug,title,area,level,mode,duration,price,estimated_date,schedule,description,outcomes,active,featured,updated_at").order("updated_at", { ascending: false }),
  ]);
  return NextResponse.json({ users: (users?.users ?? []).map((user) => ({ id: user.id, email: user.email, confirmed: Boolean(user.email_confirmed_at), createdAt: user.created_at, lastSignIn: user.last_sign_in_at })), courses: courses ?? [], role: current.member.role });
}

export async function PATCH(request: Request) {
  const current = await context();
  if (!current) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (current.member.role !== "principal") return NextResponse.json({ error: "Apenas o Admin Principal pode alterar utilizadores ou formações." }, { status: 403 });
  const body = await request.json().catch(() => null) as { type?: string; id?: string; active?: boolean; featured?: boolean; role?: "principal" | "moderator" } | null;
  if (!body?.type || !body.id) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  if (body.type === "user-status") {
    const { error } = await current.admin.auth.admin.updateUserById(body.id, { ban_duration: body.active === false ? "876000h" : "none" });
    if (error) return NextResponse.json({ error: "Não foi possível actualizar o utilizador." }, { status: 400 });
  } else if (body.type === "admin-role" && body.role) {
    const { error } = await current.admin.from("admin_members").update({ role: body.role, updated_at: new Date().toISOString() }).eq("user_id", body.id);
    if (error) return NextResponse.json({ error: "Não foi possível actualizar o nível administrativo." }, { status: 400 });
  } else if (body.type === "course-status") {
    const { error } = await current.admin.from("training_courses").update({ active: body.active, updated_at: new Date().toISOString() }).eq("slug", body.id);
    if (error) return NextResponse.json({ error: "Não foi possível actualizar a formação." }, { status: 400 });
  } else if (body.type === "course-featured") {
    const { error } = await current.admin.from("training_courses").update({ featured: body.featured, updated_at: new Date().toISOString() }).eq("slug", body.id);
    if (error) return NextResponse.json({ error: "Não foi possível destacar a formação." }, { status: 400 });
  } else return NextResponse.json({ error: "Operação não suportada." }, { status: 400 });
  await current.admin.from("admin_audit_logs").insert({ actor_id: current.user.id, action: `admin_catalog_${body.type}`, entity_type: body.type, entity_id: body.type?.startsWith("course") ? null : body.id, metadata: body });
  return NextResponse.json({ ok: true });
}
