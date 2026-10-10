import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CrmBoard } from "@/components/CrmBoard";
import { CRM_PASSWORD_COOKIE_NAME, verifyCrmPasswordSessionToken } from "@/lib/supabase/crm-password-session";
import { isOkutiCrmEmail } from "@/lib/supabase/crm-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmHomePage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase || !process.env.CRM_SHARED_ACCESS_PASSWORD) redirect("/crm/login?error=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/crm/login");
  if (!user.email_confirmed_at || !isOkutiCrmEmail(user.email)) redirect("/crm/login?error=domain");

  const cookieStore = await cookies();
  const token = cookieStore.get(CRM_PASSWORD_COOKIE_NAME)?.value;
  if (!verifyCrmPasswordSessionToken(token, user.id, process.env.CRM_SHARED_ACCESS_PASSWORD)) {
    redirect("/crm/login?error=password");
  }
  return <CrmBoard standalone />;
}
