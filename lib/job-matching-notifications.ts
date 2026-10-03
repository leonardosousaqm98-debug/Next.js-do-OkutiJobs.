import "server-only";
import { calculateJobMatch } from "@/lib/job-matching";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MatchSummary = { evaluated: number; matches: number; notificationsSent: number; emailsAttempted: number; breakdown: { perfect: number; strong: number } };

export async function runJobMatching(jobId: string): Promise<MatchSummary> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Configuração Supabase incompleta.");
  const { data: job, error: jobError } = await admin.from("jobs").select("id,slug,company_id,title,status,country,province,city,work_mode,contract_type,availability,seniority_level,functional_area,nationalities,driving_categories,hard_skills,required_certifications,languages,salary_min,salary_max").eq("id", jobId).maybeSingle();
  if (jobError) throw new Error("Não foi possível carregar a vaga para matching.");
  if (!job || job.status !== "published") throw new Error("A vaga tem de estar publicada para executar o matching.");
  const { data: candidates, error: candidateError } = await admin.from("candidate_profiles").select("id,country,province,municipality,city,seniority_level,functional_areas,skills,hard_skills,certifications,certifications_structured,languages,language_items,driving_categories,nationality,salary_min_amount,salary_max_amount,preferred_work_mode,contract_type,availability,willing_to_relocate").eq("visibility", "public").eq("open_to_work", true).limit(1000);
  if (candidateError) throw new Error("Não foi possível carregar os candidatos.");
  const matches = (candidates ?? []).map((candidate) => ({ candidate, result: calculateJobMatch(job, candidate) })).filter(({ result }) => result.score >= 50);
  let notificationsSent = 0; let emailsAttempted = 0;
  for (const { candidate, result } of matches) {
    const kind = `job_match_${result.tier}`;
    const title = result.tier === "perfect" ? `Vaga Ideal Encontrada: ${job.title}` : `Oportunidade Alinhada com o seu Perfil: ${job.title}`;
    const body = `Compatibilidade de ${result.score}%. Critérios correspondentes: ${result.matched.join(", ") || "perfil geral"}.`;
    const href = `/vagas/${job.slug || job.id}`;
    const { data: existing } = await admin.from("notifications").select("id").eq("user_id", candidate.id).eq("kind", kind).eq("href", href).maybeSingle();
    if (!existing) {
      const { error } = await admin.from("notifications").insert({ user_id: candidate.id, kind, title, body, href });
      if (!error) notificationsSent += 1;
    }
    const userResult = await admin.auth.admin.getUserById(candidate.id);
    const email = userResult.data.user?.email; const resendKey = process.env.RESEND_API_KEY;
    if (email && resendKey && !existing) {
      emailsAttempted += 1;
      await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL || "OkutiJobs <noreply@okutijobs.com>", to: [email], subject: title, html: `<p>${body}</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://okutijobs.com"}${href}">Ver oportunidade</a></p>` }) }).catch(() => undefined);
    }
  }
  return { evaluated: candidates?.length ?? 0, matches: matches.length, notificationsSent, emailsAttempted, breakdown: { perfect: matches.filter((item) => item.result.tier === "perfect").length, strong: matches.filter((item) => item.result.tier === "strong").length } };
}
