import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PortalDashboard } from "@/components/PortalDashboard";
export default async function CandidatePortalPage() { const supabase = await createSupabaseServerClient(); const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } }; if (!data.user) redirect("/login"); return <PortalDashboard kind="candidate" email={data.user.email ?? "Candidato autenticado"} />; }
