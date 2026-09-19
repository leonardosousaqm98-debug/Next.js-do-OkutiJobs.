import "server-only";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidTemporaryAdminToken } from "@/lib/admin-temp-access";

export async function requirePlatformAdmin() {
  const supabase = await createSupabaseServerClient();
  const temporaryToken = (await cookies()).get("okutijobs_temp_admin")?.value;
  const temporaryAccess = isValidTemporaryAdminToken(temporaryToken);
  if (!supabase && !temporaryAccess) redirect("/login?error=configuration");
  if (temporaryAccess) {
    const admin = createSupabaseAdminClient();
    if (!admin) redirect("/login?error=configuration");
    return { admin, user: { id: "temporary-admin", email: "leonardosousaqm98@gmail.com" }, member: { display_name: "Leonardo Sousa", status: "active", mfa_enrolled: false } };
  }
  if (!supabase) redirect("/login?error=configuration");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?error=admin-required");
  const admin = createSupabaseAdminClient();
  if (!admin) redirect("/login?error=configuration");
  const { data: member } = await admin.from("admin_members").select("user_id,display_name,status,mfa_enrolled").eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
  if (!member) redirect("/login?error=admin-required");
  return { admin, user: auth.user, member };
}
