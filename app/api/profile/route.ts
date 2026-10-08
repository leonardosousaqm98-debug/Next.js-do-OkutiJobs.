import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedLanguages = new Set(["pt", "en", "es", "fr", "hi", "zh", "ar"]);
const allowedVisibility = new Set(["private", "public"]);
const allowedCurrencies = new Set(["AOA", "USD"]);
const allowedPeriods = new Set(["monthly", "annual", "hourly"]);

function cleanText(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) || null : null; }
function cleanList(value: unknown, maxItems = 30) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item, 200)).filter((item): item is string => Boolean(item)).slice(0, maxItems);
}
function cleanObjects(value: unknown, maxItems = 30) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)).slice(0, maxItems).map((item) => Object.fromEntries(Object.entries(item).map(([key, val]) => [key, typeof val === "boolean" ? val : cleanText(val, 1200)])));
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
  return NextResponse.json({ profile: { fullName: profile?.full_name ?? authData.user.user_metadata?.full_name ?? "", preferredLanguage: profile?.preferred_language ?? "pt" }, candidate: candidate ?? {}, documents: documents ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const min = Number(body.salaryMinAmount); const max = Number(body.salaryMaxAmount);
  if (Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max >= 0 && max < min) return NextResponse.json({ error: "A pretensão máxima deve ser igual ou superior à mínima." }, { status: 400 });
  const fullName = cleanText(body.fullName, 120);
  if (!fullName || fullName.length < 2) return NextResponse.json({ error: "Indique um nome válido." }, { status: 400 });
  const candidateData: Record<string, unknown> = {
    id: authData.user.id, headline: cleanText(body.headline, 160), desired_job_title: cleanText(body.desiredJobTitle, 120), seniority_level: cleanText(body.seniorityLevel, 60), functional_areas: cleanList(body.functionalAreas, 6), bio: cleanText(body.bio, 3000), country: cleanText(body.country, 80), province: cleanText(body.province, 80), municipality: cleanText(body.municipality, 100), city: null, preferred_work_mode: cleanText(body.preferredWorkMode, 60), contract_type: cleanText(body.contractType, 60), academic_level: cleanText(body.academicLevel, 100), study_field: cleanText(body.studyField, 120), current_title: cleanText(body.currentTitle, 120), salary_min_kz: Number.isFinite(Number(body.salaryMinKz)) && Number(body.salaryMinKz) >= 0 ? Number(body.salaryMinKz) : null, salary_max_kz: Number.isFinite(Number(body.salaryMaxKz)) && Number(body.salaryMaxKz) >= 0 ? Number(body.salaryMaxKz) : null, salary_currency: allowedCurrencies.has(String(body.salaryCurrency)) ? String(body.salaryCurrency) : "AOA", salary_min_amount: Number.isFinite(min) && min >= 0 ? min : null, salary_max_amount: Number.isFinite(max) && max >= 0 ? max : null, salary_period: allowedPeriods.has(String(body.salaryPeriod)) ? String(body.salaryPeriod) : "monthly", availability: cleanText(body.availability, 80), willing_to_relocate: Boolean(body.willingToRelocate), willing_to_travel: Boolean(body.willingToTravel), open_to_work: body.openToWork !== false, visibility: "public", certifications: cleanList(body.certifications), languages: cleanList(body.languages), experience: cleanList(body.experience, 12), education: cleanList(body.education, 12), skills: cleanList(body.skills, 40), portfolio_url: cleanText(body.portfolioUrl, 300), email_primary: cleanText(body.emailPrimary, 180), phone_whatsapp: cleanText(body.phoneWhatsapp, 40), linkedin_url: cleanText(body.linkedinUrl, 300), website_url: cleanText(body.websiteUrl, 300), nationality: cleanText(body.nationality, 80), nationality_secondary: cleanText(body.nationalitySecondary, 80), place_of_birth: cleanText(body.placeOfBirth, 120), date_of_birth: cleanText(body.dateOfBirth, 20), marital_status: cleanText(body.maritalStatus, 50), passport_status: ["Sim", "Não", "Em tratamento"].includes(String(body.passportStatus)) ? String(body.passportStatus) : null, passport_number: null, passport_expiry: null, passport_issuer: null, driving_license_status: ["Sim", "Não", "Em tratamento"].includes(String(body.drivingLicenseStatus)) ? String(body.drivingLicenseStatus) : null, driving_categories: cleanList(body.drivingCategories, 10), driving_license_expiry: null, maritime_status: ["Sim", "Não", "Em tratamento"].includes(String(body.maritimeStatus)) ? String(body.maritimeStatus) : null, maritime_book_number: null, maritime_role: cleanText(body.maritimeRole, 100), maritime_certifications: cleanText(body.maritimeCertifications, 1000), professional_licenses: cleanObjects(body.professionalLicenses, 20), experiences_structured: cleanObjects(body.experiencesStructured, 20), education_structured: cleanObjects(body.educationStructured, 20), certifications_structured: cleanObjects(body.certificationsStructured, 30), hard_skills: cleanObjects(body.hardSkills, 50), language_items: cleanObjects(body.languageItems, 20), soft_skills: cleanList(body.softSkills, 20), travel_availability: cleanText(body.travelAvailability, 50), relocation_scope: cleanText(body.relocationScope, 80), offshore_rotation: cleanText(body.offshoreRotation, 80), profile_completeness: 0, updated_at: new Date().toISOString(),
  };
  const completenessFields = [candidateData.headline, candidateData.bio, candidateData.country, candidateData.province, candidateData.municipality, candidateData.current_title, candidateData.academic_level, candidateData.study_field, candidateData.preferred_work_mode, candidateData.contract_type, candidateData.availability, candidateData.desired_job_title, candidateData.seniority_level, (candidateData.functional_areas as string[]).length > 0, candidateData.salary_min_amount !== null || candidateData.salary_max_amount !== null, (candidateData.experiences_structured as unknown[]).length > 0, (candidateData.education_structured as unknown[]).length > 0, (candidateData.certifications_structured as unknown[]).length > 0, (candidateData.hard_skills as unknown[]).length > 0, (candidateData.language_items as unknown[]).length > 0, (candidateData.soft_skills as string[]).length > 0, candidateData.passport_status, candidateData.linkedin_url];
  candidateData.profile_completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100);
  const { error: profileError } = await supabase.from("profiles").upsert({ id: authData.user.id, full_name: fullName, account_type: "candidate", preferred_language: allowedLanguages.has(String(body.preferredLanguage ?? "")) ? String(body.preferredLanguage) : "pt", updated_at: new Date().toISOString() });
  if (profileError) return NextResponse.json({ error: "Não foi possível guardar o perfil." }, { status: 400 });
  const { error: candidateError } = await supabase.from("candidate_profiles").upsert(candidateData);
  if (candidateError) return NextResponse.json({ error: "Não foi possível guardar os dados profissionais." }, { status: 400 });
  return NextResponse.json({ ok: true, completeness: candidateData.profile_completeness });
}
