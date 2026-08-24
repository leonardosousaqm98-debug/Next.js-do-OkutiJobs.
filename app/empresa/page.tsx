import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PortalDashboard, type CompanyJobStat } from "@/components/PortalDashboard";

export default async function CompanyPortalPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user) redirect("/login");
  const { data: jobs } = supabase ? await supabase.from("jobs").select("id,title,status,applications(count)").eq("company_id", data.user.id).order("created_at", { ascending: false }) : { data: [] };
  const stats: CompanyJobStat[] = (jobs ?? []).map((job) => ({
    id: job.id,
    title: job.title,
    status: job.status,
    applications: Array.isArray(job.applications) ? Number(job.applications[0]?.count ?? 0) : 0,
  }));
  return <PortalDashboard kind="company" email={data.user.email ?? "Empresa autenticada"} companyStats={stats} />;
}
