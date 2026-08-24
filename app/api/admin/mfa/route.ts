import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "configuration" }, { status: 500 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") return NextResponse.json({ error: "mfa_required" }, { status: 403 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "configuration" }, { status: 500 });
  const { data: member } = await admin.from("admin_members").select("user_id").eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
  if (!member) return NextResponse.json({ error: "admin_required" }, { status: 403 });
  const { error } = await admin.from("admin_members").update({ mfa_enrolled: true, updated_at: new Date().toISOString() }).eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
