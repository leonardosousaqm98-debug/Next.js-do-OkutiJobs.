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
  if (!supabase && !temporaryAccess) redirect("/admin/login?error=configuration");
  if (temporaryAccess) {
    const admin = createSupabaseAdminClient();
    if (!admin) redirect("/admin/login?error=configuration");
    return { admin, user: { id: "temporary-admin", email: "leonardosousaqm98@gmail.com" }, member: { display_name: "Leonardo Sousa", status: "active", role: "principal", mfa_enrolled: false } };
  }
  if (!supabase) redirect("/admin/login?error=configuration");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/login?error=admin-required");
  const admin = createSupabaseAdminClient();
  if (!admin) redirect("/admin/login?error=configuration");
  const email = auth.user.email?.toLowerCase() ?? "";
  const isOwner = email === "leonardosousaqm98@gmail.com";
  const isOkutiEmail = email.endsWith("@okutijobs.com");
  if (isOwner || isOkutiEmail) {
    await admin.from("admin_members").upsert({
      user_id: auth.user.id,
      display_name: auth.user.user_metadata?.full_name || email.split("@")[0],
      status: "active",
      role: isOwner ? "principal" : "moderator",
      mfa_enrolled: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id", ignoreDuplicates: false });
  }
  const { data: member } = await admin.from("admin_members").select("user_id,display_name,status,role,mfa_enrolled").eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
  if (!member) redirect("/admin/login?error=admin-required");
  return { admin, user: auth.user, member };
}
