import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runJobMatching } from "@/lib/job-matching-notifications";

const PAGE_SIZE = 9;

function list(value: string | null) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

function clean(value: unknown, max = 5000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function jsonList(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 80) : []; }
function intOrNull(value: unknown) { const number = Number(value); return Number.isInteger(number) && number >= 0 ? number : null; }
function slugify(value: string) { return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90); }

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const title = clean(body.title, 180); const description = clean(body.description, 12000);
  if (title.length < 3 || description.length < 20) return NextResponse.json({ error: "Indique o título e uma descrição completa da vaga." }, { status: 400 });
  const publish = body.status === "published";
  if (publish && !clean(body.country, 100)) return NextResponse.json({ error: "Seleccione o país antes de publicar a vaga." }, { status: 400 });
  const { data: company } = await supabase.from("company_profiles").select("id").eq("id", auth.user.id).maybeSingle();
  if (!company) {
    const companyName = clean(auth.user.user_metadata?.company_name, 160) || clean(auth.user.user_metadata?.name, 160) || auth.user.email?.split("@")[0] || "Empresa";
    const companySlug = `${slugify(companyName) || "empresa"}-${auth.user.id.slice(0, 8)}`;
    const { error: companyError } = await supabase.from("company_profiles").upsert({ id: auth.user.id, name: companyName, slug: companySlug, country: clean(body.country, 100) || "Angola" }, { onConflict: "id" });
    if (companyError) return NextResponse.json({ error: "Não foi possível preparar a conta empresarial para publicar a vaga.", detail: companyError.message }, { status: 500 });
  }
  const baseSlug = slugify(title) || "vaga";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  const publishedAt = publish ? new Date() : null;
  const candidateAccessUntil = publishedAt ? new Date(publishedAt.getTime() + 30 * 86400000).toISOString() : null;
  const adminAccessUntil = publishedAt ? new Date(publishedAt.getTime() + 90 * 86400000).toISOString() : null;
  const { data, error } = await supabase.from("jobs").insert({ company_id: auth.user.id, title, slug, description, requirements: clean(body.requirements, 8000) || null, country: clean(body.country, 100) || "Angola", province: clean(body.province, 100) || null, city: clean(body.city, 100) || null, work_mode: clean(body.work_mode, 60) || null, contract_type: clean(body.contract_type, 60) || null, availability: clean(body.availability, 180) || null, industry: clean(body.industry, 120) || null, functional_area: clean(body.functional_area, 120) || null, seniority_level: clean(body.seniority_level, 120) || null, nationalities: jsonList(body.nationalities), passport_requirements: jsonList(body.passport_requirements), age_min: intOrNull(body.age_min), age_max: intOrNull(body.age_max), driving_categories: jsonList(body.driving_categories), required_certifications: jsonList(body.required_certifications), hard_skills: jsonList(body.hard_skills), languages: jsonList(body.languages), salary_currency: clean(body.salary_currency, 10) || "AOA", salary_min: Number.isFinite(Number(body.salary_min)) && Number(body.salary_min) >= 0 ? Number(body.salary_min) : null, salary_max: Number.isFinite(Number(body.salary_max)) && Number(body.salary_max) >= 0 ? Number(body.salary_max) : null, salary_visibility: ["public", "confidential", "negotiable"].includes(clean(body.salary_visibility, 20)) ? clean(body.salary_visibility, 20) : "confidential", benefits: jsonList(body.benefits), status: publish ? "published" : "draft", published_at: publishedAt?.toISOString() ?? null, expires_at: candidateAccessUntil, candidate_access_until: candidateAccessUntil, admin_access_until: adminAccessUntil, publication_mode: "public" }).select("id,slug,title,status").single();
  if (error) return NextResponse.json({ error: "Não foi possível guardar/publicar a vaga.", detail: error.message }, { status: 500 });
  let matching = null;
  if (publish && data?.id) {
    try { matching = await runJobMatching(data.id); }
    catch (matchingError) { console.error("[job-matching] publication hook failed", matchingError); }
  }
  return NextResponse.json({ ok: true, job: data, matching });
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ jobs: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page") || 1));
  const q = params.get("q")?.trim();
  const customArea = params.get("categoriaManual")?.trim();
  const countries = list(params.get("pais"));
  const cities = list(params.get("cidade"));
  const provinces = list(params.get("localizacao")).filter((item) => item.toLowerCase() !== "remoto");
  const models = list(params.get("modelo"));
  const contracts = list(params.get("contrato"));
  const sort = params.get("sort") || "recent";

  let query = supabase.from("jobs").select("id,company_id,slug,title,description,requirements,country,province,city,work_mode,contract_type,created_at,published_at", { count: "exact" }).eq("status", "published");
  if (q || customArea) {
    const search = [q, customArea].filter(Boolean).join(" ");
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,requirements.ilike.%${search}%`);
  }
  if (countries.length) query = query.in("country", countries);
  if (cities.length) query = query.in("city", cities);
  if (provinces.length) query = query.in("province", provinces);
  if (models.length) query = query.in("work_mode", models);
  if (contracts.length) query = query.in("contract_type", contracts);
  if (sort === "popular") query = query.order("created_at", { ascending: false });
  else query = query.order("published_at", { ascending: false });
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) return NextResponse.json({ error: "Não foi possível pesquisar vagas." }, { status: 500 });
  return NextResponse.json({ jobs: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE });
}
