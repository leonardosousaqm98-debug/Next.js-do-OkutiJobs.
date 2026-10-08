import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type LlmResponse = { choices?: Array<{ message?: { content?: string } }> };

const schema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      candidateId: { type: "string" },
      score: { type: "integer", minimum: 0, maximum: 100 },
      recommendation: { type: "string", enum: ["strong_match", "review", "low_match"] },
      strengths: { type: "array", items: { type: "string" } },
      gaps: { type: "array", items: { type: "string" } },
      interviewTopics: { type: "array", items: { type: "string" } },
    },
    required: ["candidateId", "score", "recommendation", "strengths", "gaps", "interviewTopics"],
  },
} as const;

function text(value: unknown) { return String(value ?? "").trim().slice(0, 5000); }
function list(value: unknown) { return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean).slice(0, 40) : []; }

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Serviço de recrutamento indisponível." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão como empresa." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { jobId?: unknown };
  const jobId = text(body.jobId);
  if (!jobId) return NextResponse.json({ error: "Indique a vaga a analisar." }, { status: 400 });
  const { data: job } = await admin.from("jobs").select("id,title,description,requirements,province,city,work_mode,contract_type,seniority_level,hard_skills,languages,required_certifications").eq("id", jobId).eq("company_id", auth.user.id).maybeSingle();
  if (!job) return NextResponse.json({ error: "Vaga não encontrada ou sem autorização." }, { status: 404 });
  const { data: applications } = await admin.from("applications").select("candidate_id").eq("job_id", jobId).limit(40);
  const candidateIds = Array.from(new Set((applications ?? []).map((row) => row.candidate_id).filter(Boolean)));
  if (!candidateIds.length) return NextResponse.json({ jobId, results: [], message: "Ainda não existem candidaturas para esta vaga." });
  const [{ data: candidates }, { data: profiles }] = await Promise.all([
    admin.from("candidate_profiles").select("id,headline,desired_job_title,current_title,seniority_level,province,municipality,academic_level,study_field,skills,functional_areas,languages,certifications,experiences_structured,education_structured,certifications_structured,hard_skills,language_items,soft_skills,availability,preferred_work_mode").in("id", candidateIds),
    admin.from("profiles").select("id,full_name").in("id", candidateIds),
  ]);
  const profileNames = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name || "Candidato"]));
  const candidatePayload = (candidates ?? []).map((candidate) => ({ candidateId: candidate.id, name: profileNames.get(candidate.id) || "Candidato", profile: candidate }));
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  const baseUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/$/, "") || "https://forge.manus.im";
  if (!apiKey) return NextResponse.json({ error: "A IA de triagem ainda não está configurada." }, { status: 503 });
  const response = await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-5-mini", max_completion_tokens: 5000, messages: [{ role: "system", content: "És um assistente de triagem de recrutamento. Compara os requisitos da vaga com os dados explícitos dos candidatos. Não inventes qualificações, não elimines pessoas automaticamente e não uses idade, género, nacionalidade, fotografia, saúde, religião ou outros dados protegidos. Dá uma recomendação explicável para revisão humana. Responde apenas JSON." }, { role: "user", content: JSON.stringify({ job: { title: job.title, description: text(job.description), requirements: text(job.requirements), location: [job.city, job.province].filter(Boolean).join(", "), workMode: job.work_mode, contract: job.contract_type, seniority: job.seniority_level, skills: list(job.hard_skills), languages: list(job.languages), certifications: list(job.required_certifications) }, candidates: candidatePayload }) }], response_format: { type: "json_schema", json_schema: { name: "candidate_triage", strict: true, schema } } }) });
  if (!response.ok) return NextResponse.json({ error: "A IA não conseguiu concluir a triagem. Tente novamente." }, { status: 502 });
  const result = await response.json() as LlmResponse;
  const content = result.choices?.[0]?.message?.content;
  if (!content) return NextResponse.json({ error: "A IA não devolveu uma triagem válida." }, { status: 502 });
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { return NextResponse.json({ error: "A resposta da IA não pôde ser validada." }, { status: 502 }); }
  const rows = Array.isArray(parsed) ? parsed : [];
  const results: Array<Record<string, unknown>> = rows.map((item) => ({ ...(item as Record<string, unknown>), name: profileNames.get(String((item as Record<string, unknown>).candidateId)) || "Candidato" }));
  results.sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0));
  return NextResponse.json({ jobId, results, reviewedBy: "IA assistida — decisão final da empresa" });
}
