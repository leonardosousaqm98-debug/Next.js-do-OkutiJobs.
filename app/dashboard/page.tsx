import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user || !supabase) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,account_type,full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  const metadataType = data.user.user_metadata?.account_type === "company" ? "company" : "candidate";
  const accountType = profile?.account_type === "company" ? "company" : profile?.account_type === "candidate" ? "candidate" : metadataType;
  if (!profile) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? "Novo utilizador",
        account_type: accountType,
        preferred_language: "pt",
      },
      { onConflict: "id" },
    );
  }

  redirect(accountType === "company" ? "/empresa" : "/candidato");
}
