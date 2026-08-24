import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user || !supabase) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id,account_type,full_name").eq("id", data.user.id).maybeSingle();
  if (!profile) {
    await supabase.from("profiles").upsert({ id: data.user.id, full_name: data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? "Novo utilizador", account_type: "candidate", preferred_language: "pt" }, { onConflict: "id" });
  }
  return <main className="shell"><section className="hero dashboard-card"><p className="eyebrow">Área reservada</p><h1>Bem-vindo à OkutiJobs.</h1><p className="lede">A sua sessão foi validada no Supabase e o perfil base está pronto. Escolha o percurso que pretende explorar.</p><div className="panel"><strong>{data.user.email ?? "Utilizador autenticado"}</strong><p>O seu acesso está activo. Pode explorar vagas, completar o perfil e carregar um CV privado.</p><div className="hero-actions"><a className="primary-button inline-button" href="/profile">Abrir perfil candidato</a><a className="text-button inline-button" href="/vagas">Explorar vagas</a></div></div></section></main>;
}
