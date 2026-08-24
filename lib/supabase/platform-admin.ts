import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requirePlatformAdmin() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?error=configuration");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?error=admin-required");
  const admin = createSupabaseAdminClient();
  if (!admin) redirect("/login?error=configuration");
  const { data: member } = await admin.from("admin_members").select("user_id,display_name,status,mfa_enrolled").eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
  if (!member) redirect("/login?error=admin-required");
  return { admin, user: auth.user, member };
}
