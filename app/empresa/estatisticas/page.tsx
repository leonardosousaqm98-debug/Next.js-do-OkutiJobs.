import { redirect } from "next/navigation";
import { CompanyStatistics, type CompanyStatisticsData } from "@/components/CompanyStatistics";
import { SiteHeader } from "@/components/SiteHeader";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CompanyStatisticsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!auth.user || !supabase) redirect("/login?next=/empresa/estatisticas");
  const { data: jobs } = await supabase.from("jobs").select("id,title,status,created_at,applications(id,status,created_at)").eq("company_id", auth.user.id).order("created_at", { ascending: false });
  const rows = (jobs ?? []) as Array<{ id: string; title: string; status: string; created_at: string; applications: Array<{ id: string; status: string; created_at: string }> | null }>;
  const allApplications = rows.flatMap((job) => job.applications ?? []);
  const activeStatuses = new Set(["submitted", "screening", "interview", "offer"]);
  const now = Date.now();
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(now - (6 - offset) * 86400000);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const end = start + 86400000;
    return { label: date.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", ""), value: allApplications.filter((application) => { const time = new Date(application.created_at).getTime(); return time >= start && time < end; }).length };
  });
  const statusLabels: Array<[string, string, string]> = [["Recebidas", "submitted", "status-blue"], ["Em triagem", "screening", "status-orange"], ["Entrevistas", "interview", "status-green"], ["Propostas", "offer", "status-purple"], ["Concluídas", "accepted", "status-dark"]];
  const data: CompanyStatisticsData = {
    jobs: rows.map((job) => ({ id: job.id, title: job.title, status: job.status, applications: job.applications?.length ?? 0 })),
    totals: { jobs: rows.length, published: rows.filter((job) => job.status === "published").length, applications: allApplications.length, activeApplications: allApplications.filter((application) => activeStatuses.has(application.status)).length, average: rows.length ? Math.round(allApplications.length / rows.length) : 0, lastSevenDays: days.reduce((sum, day) => sum + day.value, 0) },
    statuses: statusLabels.map(([label, status, tone]) => ({ label, value: allApplications.filter((application) => application.status === status).length, tone })),
    days,
  };
  return <><SiteHeader signedIn accountHref="/empresa" /><CompanyStatistics data={data} /></>;
}
