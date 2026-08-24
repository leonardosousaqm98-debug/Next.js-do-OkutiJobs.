import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedLanguages = new Set(["pt", "en", "fr", "ar"]);
const allowedVisibility = new Set(["private", "public"]);
const allowedCurrencies = new Set(["AOA", "USD"]);
const allowedPeriods = new Set(["monthly", "annual", "hourly"]);

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) || null : null;
}

function cleanList(value: unknown, maxItems = 20) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item, 100)).filter((item): item is string => Boolean(item)).slice(0, maxItems);
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });

  const [{ data: profile }, { data: candidate }, { data: documents }] = await Promise.all([
    supabase.from("profiles").select("full_name, preferred_language").eq("id", authData.user.id).maybeSingle(),
    supabase.from("candidate_profiles").select("*").eq("id", authData.user.id).maybeSingle(),
    supabase.from("candidate_documents").select("original_name, document_type, created_at").eq("candidate_id", authData.user.id).order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    profile: { fullName: profile?.full_name ?? authData.user.user_metadata?.full_name ?? "", preferredLanguage: profile?.preferred_language ?? "pt" },
    candidate: candidate ?? {},
    documents: documents ?? [],
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const requestedSalaryMin = Number(body.salaryMinAmount);
  const requestedSalaryMax = Number(body.salaryMaxAmount);
  if (Number.isFinite(requestedSalaryMin) && Number.isFinite(requestedSalaryMax) && requestedSalaryMax >= 0 && requestedSalaryMin >= 0 && requestedSalaryMax < requestedSalaryMin) return NextResponse.json({ error: "A pretensão máxima deve ser igual ou superior à mínima." }, { status: 400 });
  const fullName = cleanText(body.fullName, 120);
  const preferredLanguage = allowedLanguages.has(String(body.preferredLanguage ?? "")) ? String(body.preferredLanguage) : "pt";
  if (!fullName || fullName.length < 2) return NextResponse.json({ error: "Indique um nome válido." }, { status: 400 });

  const candidateData = {
    id: authData.user.id,
    headline: cleanText(body.headline, 160),
    desired_job_title: cleanText(body.desiredJobTitle, 120),
    seniority_level: cleanText(body.seniorityLevel, 60),
    functional_areas: cleanList(body.functionalAreas, 3),
    bio: cleanText(body.bio, 2000),
    country: cleanText(body.country, 80),
    province: cleanText(body.province, 80),
    municipality: cleanText(body.municipality, 100),
    city: cleanText(body.city, 80),
    preferred_work_mode: cleanText(body.preferredWorkMode, 60),
    contract_type: cleanText(body.contractType, 60),
    academic_level: cleanText(body.academicLevel, 100),
    study_field: cleanText(body.studyField, 120),
    current_title: cleanText(body.currentTitle, 120),
    salary_min_kz: Number.isFinite(Number(body.salaryMinKz)) && Number(body.salaryMinKz) >= 0 ? Number(body.salaryMinKz) : null,
    salary_max_kz: Number.isFinite(Number(body.salaryMaxKz)) && Number(body.salaryMaxKz) >= 0 ? Number(body.salaryMaxKz) : null,
    salary_currency: allowedCurrencies.has(String(body.salaryCurrency)) ? String(body.salaryCurrency) : "AOA",
    salary_min_amount: Number.isFinite(Number(body.salaryMinAmount)) && Number(body.salaryMinAmount) >= 0 ? Number(body.salaryMinAmount) : null,
    salary_max_amount: Number.isFinite(Number(body.salaryMaxAmount)) && Number(body.salaryMaxAmount) >= 0 ? Number(body.salaryMaxAmount) : null,
    salary_period: allowedPeriods.has(String(body.salaryPeriod)) ? String(body.salaryPeriod) : "monthly",
    availability: cleanText(body.availability, 80),
    willing_to_relocate: Boolean(body.willingToRelocate),
    willing_to_travel: Boolean(body.willingToTravel),
    open_to_work: body.openToWork !== false,
    visibility: allowedVisibility.has(String(body.visibility)) ? String(body.visibility) : "private",
    certifications: cleanList(body.certifications),
    languages: cleanList(body.languages),
    experience: cleanList(body.experience, 12),
    education: cleanList(body.education, 12),
    skills: cleanList(body.skills, 30),
    portfolio_url: cleanText(body.portfolioUrl, 300),
    profile_completeness: 0,
    updated_at: new Date().toISOString(),
  };

  const completenessFields = [candidateData.headline, candidateData.bio, candidateData.country, candidateData.province, candidateData.city, candidateData.current_title, candidateData.academic_level, candidateData.study_field, candidateData.preferred_work_mode, candidateData.contract_type, candidateData.availability, candidateData.desired_job_title, candidateData.seniority_level, candidateData.functional_areas.length > 0, candidateData.salary_min_amount !== null || candidateData.salary_max_amount !== null, candidateData.certifications.length > 0, candidateData.languages.length > 0, candidateData.experience.length > 0, candidateData.education.length > 0, candidateData.skills.length > 0];
  candidateData.profile_completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100);

  const { error: profileError } = await supabase.from("profiles").upsert({ id: authData.user.id, full_name: fullName, account_type: "candidate", preferred_language: preferredLanguage, updated_at: new Date().toISOString() });
  if (profileError) return NextResponse.json({ error: "Não foi possível guardar o perfil." }, { status: 400 });

  const { error: candidateError } = await supabase.from("candidate_profiles").upsert(candidateData);
  if (candidateError) return NextResponse.json({ error: "Não foi possível guardar os dados profissionais." }, { status: 400 });

  return NextResponse.json({ ok: true, completeness: candidateData.profile_completeness });
}
