import { JobsCatalog, type Job } from "@/components/MigratedCatalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SupabaseJob = { id: string; company_id: string; slug: string; title: string; description: string; requirements: string | null; country: string | null; province: string | null; city: string | null; work_mode: string | null; contract_type: string | null };
type PublicCompany = { id: string; name: string };

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient();
  let jobs: Job[] = [];
  if (supabase) {
    const { data } = await supabase.from("jobs").select("id,company_id,slug,title,description,requirements,country,province,city,work_mode,contract_type").eq("status", "published").order("published_at", { ascending: false });
    const rows = (data ?? []) as SupabaseJob[];
    const companyIds = Array.from(new Set(rows.map((job) => job.company_id)));
    const { data: companies } = companyIds.length ? await supabase.from("public_company_profiles").select("id,name").in("id", companyIds) : { data: [] as PublicCompany[] };
    const companyMap = new Map(((companies ?? []) as PublicCompany[]).map((company) => [company.id, company.name]));
    jobs = rows.map((job) => { const searchable = `${job.title} ${job.description} ${job.requirements ?? ""}`.toLowerCase(); const area = searchable.includes("contabilidade") ? "Contabilidade" : searchable.includes("futebol") || searchable.includes("jogos") ? "Desporto" : searchable.includes("manutenção") || searchable.includes("mecânica") ? "Manutenção" : searchable.includes("financeiro") || searchable.includes("finanças") ? "Finanças" : "Outras áreas"; const salaryMatch = searchable.match(/([0-9]{3})[.]000/); const salaryKz = salaryMatch ? Number(salaryMatch[1]) * 1000 : null; const experienceMatch = searchable.match(/(?:mínimo de|pelo menos|entre)\s*(\d{1,2})\s*anos/); const experienceYears = experienceMatch ? Number(experienceMatch[1]) : null; return { id: job.id, slug: job.slug, title: job.title, description: job.description, requirements: job.requirements, company: companyMap.get(job.company_id) || "Empresa verificada", place: [job.city, job.province, job.country].filter(Boolean).join(" · "), mode: job.work_mode || "A definir", area, salaryKz, experienceYears, contract: job.contract_type || "Oportunidade" }; });
  }
  const areas = Array.from(new Set(jobs.map((job) => job.area).filter(Boolean))).sort();
  const provinces = Array.from(new Set(jobs.flatMap((job) => job.place.split(" · ").slice(1, 2)).filter(Boolean))).sort();
  return <JobsCatalog jobs={jobs} areas={areas} provinces={provinces} />;
}
