import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateMatch } from "@/lib/matching/candidate-match";

export const dynamic = "force-dynamic";

type JobRow = { id: string; title: string; requirements: string | null; province: string | null; city: string | null };
type ApplicationRow = { id: string; job_id: string; candidate_id: string; status: string; created_at: string };
type CandidateRow = { id: string; headline: string | null; province: string | null; city: string | null; current_title: string | null; academic_level: string | null; study_field: string | null; desired_job_title: string | null; seniority_level: string | null; skills: unknown; functional_areas: unknown; salary_currency: string | null; salary_min_amount: number | null; salary_max_amount: number | null };
type ProfileRow = { id: string; full_name: string | null };
type DocumentRow = { candidate_id: string; original_name: string; storage_path: string; created_at: string };

export default async function CompanyApplicationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!auth.user) redirect("/login");
  const { data: jobs } = await supabase!.from("jobs").select("id,title,requirements,province,city").eq("company_id", auth.user.id).order("created_at", { ascending: false });
  const ownedJobs = (jobs ?? []) as JobRow[];
  const jobIds = ownedJobs.map((job) => job.id);
  const admin = createSupabaseAdminClient();
  const { data: applications } = admin && jobIds.length ? await admin.from("applications").select("id,job_id,candidate_id,status,created_at").in("job_id", jobIds).order("created_at", { ascending: false }) : { data: [] as ApplicationRow[] };
  const rows = (applications ?? []) as ApplicationRow[];
  const candidateIds = Array.from(new Set(rows.map((row) => row.candidate_id)));
  const [{ data: candidates }, { data: profiles }, { data: documents }] = admin && candidateIds.length ? await Promise.all([
    admin.from("candidate_profiles").select("id,headline,province,city,current_title,academic_level,study_field,desired_job_title,seniority_level,skills,functional_areas,salary_currency,salary_min_amount,salary_max_amount").in("id", candidateIds),
    admin.from("profiles").select("id,full_name").in("id", candidateIds),
    admin.from("candidate_documents").select("candidate_id,original_name,storage_path,created_at").in("candidate_id", candidateIds).eq("document_type", "cv").order("created_at", { ascending: false }),
  ]) : [{ data: [] as CandidateRow[] }, { data: [] as ProfileRow[] }, { data: [] as DocumentRow[] }];
  const candidateMap = new Map((candidates as CandidateRow[]).map((candidate) => [candidate.id, candidate]));
  const profileMap = new Map((profiles as ProfileRow[]).map((profile) => [profile.id, profile]));
  const jobMap = new Map(ownedJobs.map((job) => [job.id, job]));
  const latestDocument = new Map<string, DocumentRow>();
  for (const document of documents as DocumentRow[]) if (!latestDocument.has(document.candidate_id)) latestDocument.set(document.candidate_id, document);
  const cards = await Promise.all(rows.map(async (application) => {
    const document = latestDocument.get(application.candidate_id);
    const signed = document && admin ? await admin.storage.from("candidate-documents").createSignedUrl(document.storage_path, 300) : { data: null };
    const job = jobMap.get(application.job_id);
    const candidateRow = candidateMap.get(application.candidate_id);
    const match = candidateRow && job ? calculateMatch(candidateRow, { title: job.title, province: job.province || job.city || undefined, studyField: job.requirements?.split(/[;,\\n]/)[0]?.trim() || undefined }) : null;
    return { application, candidate: candidateRow, profile: profileMap.get(application.candidate_id), jobTitle: job?.title || "Oferta", match, document, cvUrl: signed.data?.signedUrl || null };
  }));
  return <main><header className="site-header"><a href="/empresa" className="brand" aria-label="Voltar ao painel empresarial"><span className="brand-lockup"><span className="brand-symbol"><img src="https://wmkxeqghopmbsfwptpzq.supabase.co/storage/v1/object/public/brand-assets/okutijobs-new-mark.png" alt="" /></span><span className="brand-word">Okuti<span>Jobs</span></span></span></a><nav className="desktop-nav" aria-label="Navegação empresarial"><a href="/empresa">Painel</a><a href="/vagas">Vagas</a><a href="/formacoes">Formações</a></nav><div className="header-actions"><a className="button button-dark header-cta" href="/empresa">Voltar ao painel <span>↗</span></a></div></header><section className="portal-wrap applications-page"><div className="portal-heading"><div><p className="eyebrow">Área da empresa</p><h1>Candidaturas recebidas.</h1><p className="lede">Consulte os perfis que se candidataram às suas vagas. Os CVs são disponibilizados através de links privados e temporários.</p></div><span className="portal-status">● {rows.length} candidatura{rows.length === 1 ? "" : "s"}</span></div>{cards.length ? <div className="applications-grid">{cards.map(({ application, candidate, profile, jobTitle, match, document, cvUrl }) => <article className="received-application" key={application.id}><div className="application-card-top"><span className="job-tag">{application.status}</span><time dateTime={application.created_at}>{new Date(application.created_at).toLocaleDateString("pt-PT")}</time></div><h2>{profile?.full_name || "Candidato"}</h2><p className="received-role">{candidate?.current_title || candidate?.headline || "Perfil profissional"}</p><p className="received-job">Candidatura para: <strong>{jobTitle}</strong></p><p className="received-meta">{[candidate?.city, candidate?.province, candidate?.academic_level, candidate?.study_field].filter(Boolean).join(" · ") || "Perfil ainda em preenchimento"}</p>{match ? <div className="ats-match"><strong>{match.score}% Match Score</strong><span>{match.reasons.slice(0, 3).join(" · ") || "A rever"}</span>{match.gaps.length ? <small>{match.gaps.slice(0, 2).join(" · ")}</small> : null}</div> : null}{document && cvUrl ? <a className="button button-orange" href={cvUrl} target="_blank" rel="noreferrer">Ver CV privado <span>↗</span></a> : <span className="document-pending">CV ainda não carregado</span>}</article>)}</div> : <div className="empty-state"><h2>Ainda não recebeu candidaturas.</h2><p>Quando um candidato enviar o seu perfil para uma vaga da empresa, o registo aparecerá aqui.</p><a className="button button-orange" href="/vagas">Ver vagas públicas <span>↗</span></a></div>}</section></main>;
}
