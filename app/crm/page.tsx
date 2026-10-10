import { redirect } from "next/navigation";
import { CrmBoard } from "@/components/CrmBoard";
import { isOkutiCrmEmail } from "@/lib/supabase/crm-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmHomePage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/crm/login?error=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/crm/login");
  if (!user.email_confirmed_at || !isOkutiCrmEmail(user.email)) redirect("/crm/login?error=domain");
  return <CrmBoard standalone />;
}
