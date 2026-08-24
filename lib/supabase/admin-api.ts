import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminApiContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { response: NextResponse.json({ error: "configuration" }, { status: 500 }) } as const;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) } as const;
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") return { response: NextResponse.json({ error: "mfa_required" }, { status: 403 }) } as const;
  const admin = createSupabaseAdminClient();
  if (!admin) return { response: NextResponse.json({ error: "configuration" }, { status: 500 }) } as const;
  const { data: member } = await admin.from("admin_members").select("user_id,status,mfa_enrolled").eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
  if (!member || !member.mfa_enrolled) return { response: NextResponse.json({ error: "admin_mfa_required" }, { status: 403 }) } as const;
  return { admin, user: auth.user, member } as const;
}
