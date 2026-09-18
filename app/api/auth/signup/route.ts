import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const accountTypes = new Set(["candidate", "company"]);

function slugForCompany(email: string, id: string) {
  const local = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "empresa";
  return `${local}-${id.slice(0, 8)}`;
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = createSupabaseAdminClient();
  if (!url || !anonKey || !admin) return NextResponse.json({ error: "A autenticação não está configurada." }, { status: 503 });

  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown; accountType?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const accountType = typeof body?.accountType === "string" && accountTypes.has(body.accountType) ? body.accountType : "candidate";
  if (!emailPattern.test(email)) return NextResponse.json({ error: "Introduza um email válido." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "A palavra-passe deve ter pelo menos 8 caracteres." }, { status: 400 });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { preferred_language: "pt", account_type: accountType, email_verification_pending: true },
  });
  if (createError || !created.user) return NextResponse.json({ error: createError?.message?.toLowerCase().includes("already") ? "Este email já tem uma conta. Inicie sessão." : "Não foi possível criar a conta. Verifique os dados e tente novamente." }, { status: 400 });

  const user = created.user;
  const displayName = email.split("@")[0] || "Utilizador OkutiJobs";
  const { error: profileError } = await admin.from("profiles").upsert({ id: user.id, full_name: displayName, account_type: accountType, preferred_language: "pt", updated_at: new Date().toISOString() });
  if (profileError) {
    await admin.auth.admin.deleteUser(user.id);
    return NextResponse.json({ error: "Não foi possível preparar o perfil da conta." }, { status: 500 });
  }

  if (accountType === "candidate") {
    const { error } = await admin.from("candidate_profiles").upsert({ id: user.id, open_to_work: true, visibility: "private", profile_completeness: 0, certifications: [], languages: [], updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: "Conta criada, mas não foi possível preparar o perfil de candidato." }, { status: 500 });
  } else {
    const { error } = await admin.from("company_profiles").upsert({ id: user.id, name: displayName, slug: slugForCompany(email, user.id), country: "Angola", updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: "Conta criada, mas não foi possível preparar o perfil empresarial." }, { status: 500 });
  }

  const auth = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: sessionData, error: sessionError } = await auth.auth.signInWithPassword({ email, password });
  if (sessionError || !sessionData.session) return NextResponse.json({ error: "Conta criada. Não foi possível iniciar a sessão automaticamente; tente entrar novamente." }, { status: 500 });

  const server = await createSupabaseServerClient();
  if (!server) return NextResponse.json({ error: "Conta criada. Não foi possível guardar a sessão neste momento." }, { status: 503 });
  const { error: cookieError } = await server.auth.setSession({ access_token: sessionData.session.access_token, refresh_token: sessionData.session.refresh_token });
  if (cookieError) return NextResponse.json({ error: "Conta criada. Não foi possível guardar a sessão neste momento." }, { status: 500 });

  return NextResponse.json({ ok: true, accountType, emailVerificationPending: true });
}
