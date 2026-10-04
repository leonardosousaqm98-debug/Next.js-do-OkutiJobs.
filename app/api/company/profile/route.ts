import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const fields = ["name", "legal_name", "nif", "description", "industry", "website_url", "country", "province", "municipality", "city", "address", "contact_phone", "contact_email", "employee_count", "company_size", "founded_year", "linkedin_url", "slug"] as const;
type Field = (typeof fields)[number];
function text(value: unknown, max = 5000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function optionalInt(value: unknown, min: number, max: number) { const n = Number(value); return Number.isInteger(n) && n >= min && n <= max ? n : null; }
function slug(value: string, userId: string) { const base = value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "empresa"; return `${base}-${userId.slice(0, 8)}`; }

async function getUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function GET() {
  const { supabase, user } = await getUser();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });
  const { data, error } = await supabase.from("company_profiles").select(fields.join(",")).eq("id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Não foi possível carregar o perfil empresarial." }, { status: 500 });
  return NextResponse.json({ profile: data ?? { id: user.id, name: "", country: "Angola" } });
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const name = text(body.name, 160);
  if (name.length < 2) return NextResponse.json({ error: "Indique o nome da empresa." }, { status: 400 });
  const payload: Record<string, unknown> = {
    id: user.id,
    name,
    slug: slug(name, user.id),
    legal_name: text(body.legal_name, 200) || null,
    nif: text(body.nif, 80) || null,
    description: text(body.description, 5000) || null,
    industry: text(body.industry, 160) || null,
    website_url: text(body.website_url, 500) || null,
    country: text(body.country, 120) || "Angola",
    province: text(body.province, 120) || null,
    municipality: text(body.municipality, 120) || null,
    city: text(body.city, 120) || null,
    address: text(body.address, 300) || null,
    contact_phone: text(body.contact_phone, 80) || null,
    contact_email: text(body.contact_email, 200) || user.email || null,
    employee_count: optionalInt(body.employee_count, 1, 1000000),
    company_size: text(body.company_size, 80) || null,
    founded_year: optionalInt(body.founded_year, 1800, new Date().getFullYear()),
    linkedin_url: text(body.linkedin_url, 500) || null,
    updated_at: new Date().toISOString(),
  };
  const completeness = [payload.name, payload.industry, payload.country, payload.province, payload.city, payload.address, payload.contact_phone, payload.contact_email, payload.employee_count, payload.company_size, payload.description].filter(Boolean).length;
  payload.profile_completeness = Math.round((completeness / 11) * 100);
  const { data, error } = await supabase.from("company_profiles").upsert(payload).select(fields.join(",")).single();
  if (error) return NextResponse.json({ error: "Não foi possível guardar o perfil empresarial.", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, profile: data, completeness: payload.profile_completeness });
}
