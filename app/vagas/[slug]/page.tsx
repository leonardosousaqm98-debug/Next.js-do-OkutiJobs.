import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JobDetailView, type Job } from "@/components/MigratedCatalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SupabaseJob = { id: string; company_id: string; slug: string; title: string; description: string; requirements: string | null; country: string | null; province: string | null; city: string | null; work_mode: string | null; contract_type: string | null; published_at?: string | null; updated_at?: string | null };
type PublicCompany = { id: string; name: string };

async function getPublicJob(slug: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("jobs").select("id,company_id,slug,title,description,requirements,country,province,city,work_mode,contract_type,published_at,updated_at").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) return null;
  const { data: company } = await supabase.from("public_company_profiles").select("id,name").eq("id", data.company_id).maybeSingle();
  return { row: data as SupabaseJob, company: company as PublicCompany | null };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicJob(slug);
  if (!result) return { title: "Vaga não encontrada" };
  const { row, company } = result;
  const location = [row.city, row.province, row.country].filter(Boolean).join(" · ");
  const url = `https://okutijobs.com/vagas/${encodeURIComponent(row.slug)}`;
  return {
    title: `${row.title} — ${company?.name || "Empresa"}`,
    description: `${row.title} em ${location || "Angola"}. Consulte requisitos, funções e candidate-se na OkutiJobs.`,
    alternates: { canonical: url },
    openGraph: { title: `${row.title} — ${company?.name || "Empresa"}`, description: `Oportunidade de emprego em ${location || "Angola"}.`, type: "website", url },
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicJob(slug);
  if (!result) notFound();
  const { row, company } = result;
  const location = [row.city, row.province, row.country].filter(Boolean).join(" · ");
  const job: Job = { id: row.id, slug: row.slug, title: row.title, description: row.description, requirements: row.requirements, company: company?.name || "Empresa verificada", place: location, mode: row.work_mode || "A definir", area: "Oportunidade", contract: row.contract_type || "Oportunidade" };
  const jobPosting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: row.title,
    description: row.description,
    datePosted: (row.published_at || row.updated_at || new Date().toISOString()).slice(0, 10),
    validThrough: new Date(Date.now() + 90 * 86400000).toISOString(),
    employmentType: row.contract_type || "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: company?.name || "Empresa verificada", sameAs: "https://okutijobs.com" },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: location || "Angola", addressCountry: row.country || "AO" } },
    applicantLocationRequirements: { "@type": "Country", name: row.country || "Angola" },
    url: `https://okutijobs.com/vagas/${encodeURIComponent(row.slug)}`,
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPosting) }} /><JobDetailView job={job} /></>;
}
