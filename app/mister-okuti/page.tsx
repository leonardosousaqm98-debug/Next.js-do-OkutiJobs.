import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MisterOkutiAssistant } from "@/components/MisterOkutiAssistant";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mister Okuti — Assistente virtual" };

export default async function MisterOkutiPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", auth.user.id).maybeSingle();
  if (profile?.account_type === "company") {
    const { data: company } = await supabase.from("company_profiles").select("id").eq("id", auth.user.id).maybeSingle();
    if (!company) redirect("/empresa/perfil");
    return <MisterOkutiAssistant role="company" returnTo="/empresa" />;
  }
  if (profile?.account_type === "candidate") return <MisterOkutiAssistant role="candidate" returnTo="/candidato" />;
  redirect("/dashboard");
}
