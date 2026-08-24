import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedLanguages = new Set(["pt", "en", "fr", "ar"]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });

  const body = (await request.json()) as { fullName?: string; headline?: string; preferredLanguage?: string; province?: string; city?: string; openToWork?: boolean };
  const fullName = body.fullName?.trim();
  const preferredLanguage = allowedLanguages.has(body.preferredLanguage ?? "") ? body.preferredLanguage! : "pt";
  if (!fullName || fullName.length < 2 || fullName.length > 120) return NextResponse.json({ error: "Indique um nome válido." }, { status: 400 });

  const { error: profileError } = await supabase.from("profiles").upsert({ id: authData.user.id, full_name: fullName, account_type: "candidate", preferred_language: preferredLanguage, updated_at: new Date().toISOString() });
  if (profileError) return NextResponse.json({ error: "Não foi possível guardar o perfil." }, { status: 400 });

  const { error: candidateError } = await supabase.from("candidate_profiles").upsert({ id: authData.user.id, headline: body.headline?.trim().slice(0, 160) || null, province: body.province?.trim().slice(0, 80) || null, city: body.city?.trim().slice(0, 80) || null, open_to_work: body.openToWork ?? true, updated_at: new Date().toISOString() });
  if (candidateError) return NextResponse.json({ error: "Não foi possível guardar os dados profissionais." }, { status: 400 });

  return NextResponse.json({ ok: true });
}
