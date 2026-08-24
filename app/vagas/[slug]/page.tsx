import { notFound } from "next/navigation";
import { JobDetailView, type Job } from "@/components/MigratedCatalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SupabaseJob = { id: string; company_id: string; slug: string; title: string; description: string; requirements: string | null; country: string | null; province: string | null; city: string | null; work_mode: string | null; contract_type: string | null };
type PublicCompany = { id: string; name: string };

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();
  const { data } = await supabase.from("jobs").select("id,company_id,slug,title,description,requirements,country,province,city,work_mode,contract_type").eq("slug", slug).eq("status", "published").maybeSingle();
  const row = data as SupabaseJob | null;
  if (!row) notFound();
  const { data: company } = await supabase.from("public_company_profiles").select("id,name").eq("id", row.company_id).maybeSingle();
  const job: Job = { id: row.id, slug: row.slug, title: row.title, description: row.description, requirements: row.requirements, company: (company as PublicCompany | null)?.name || "Empresa verificada", place: [row.city, row.province, row.country].filter(Boolean).join(" · "), mode: row.work_mode || "A definir", area: "Oportunidade", contract: row.contract_type || "Oportunidade" };
  return <JobDetailView job={job} />;
}
