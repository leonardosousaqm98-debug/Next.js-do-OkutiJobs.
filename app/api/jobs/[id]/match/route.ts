import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateJobMatch } from "@/lib/job-matching";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Configuração Supabase incompleta." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const { id } = await context.params;
  const { data: job, error: jobError } = await admin.from("jobs").select("id,company_id,title,status,country,province,city,work_mode,seniority_level,functional_area,hard_skills,required_certifications,languages,salary_min,salary_max").eq("id", id).maybeSingle();
  if (jobError || !job || job.company_id !== auth.user.id) return NextResponse.json({ error: "Vaga não encontrada ou sem autorização." }, { status: 403 });
  if (job.status !== "published") return NextResponse.json({ error: "As notificações só são enviadas para vagas publicadas." }, { status: 400 });
  const { data: candidates, error: candidateError } = await admin.from("candidate_profiles").select("id,country,province,city,seniority_level,functional_areas,skills,hard_skills,certifications,certifications_structured,languages,language_items,driving_categories,nationality,salary_min_amount,salary_max_amount,preferred_work_mode").eq("visibility", "public").eq("open_to_work", true).limit(1000);
  if (candidateError) return NextResponse.json({ error: "Não foi possível carregar os candidatos." }, { status: 500 });
  const matches = (candidates ?? []).map((candidate) => ({ candidate, result: calculateJobMatch(job, candidate) })).filter(({ result }) => result.score >= 50);
  let sent = 0;
  for (const { candidate, result } of matches) {
    const kind = `job_match_${result.tier}`; const title = result.tier === "perfect" ? `Vaga Ideal Encontrada: ${job.title}` : `Oportunidade Alinhada com o seu Perfil: ${job.title}`; const body = `Compatibilidade de ${result.score}%. Critérios correspondentes: ${result.matched.join(", ") || "perfil geral"}.`;
    const { data: existing } = await admin.from("notifications").select("id").eq("user_id", candidate.id).eq("kind", kind).eq("href", `/vagas/${job.id}`).maybeSingle();
    if (existing) continue;
    const { error } = await admin.from("notifications").insert({ user_id: candidate.id, kind, title, body, href: `/vagas/${job.id}` });
    if (!error) sent += 1;
    const userResult = await admin.auth.admin.getUserById(candidate.id);
    const email = userResult.data.user?.email; const resendKey = process.env.RESEND_API_KEY;
    if (email && resendKey) {
      await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL || "OkutiJobs <noreply@okutijobs.com>", to: [email], subject: title, html: `<p>${body}</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://okutijobs.com"}/vagas/${job.id}">Ver oportunidade</a></p>` }) }).catch(() => undefined);
    }
  }
  return NextResponse.json({ ok: true, evaluated: candidates?.length ?? 0, matches: matches.length, notificationsSent: sent, breakdown: { perfect: matches.filter((item) => item.result.tier === "perfect").length, strong: matches.filter((item) => item.result.tier === "strong").length } });
}
