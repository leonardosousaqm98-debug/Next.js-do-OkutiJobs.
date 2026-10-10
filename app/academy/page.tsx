import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AcademyLearnerDashboard } from "@/components/academy/AcademyLearnerDashboard";

export const metadata = { title: "OkutiAcademy — Aprendizagem contínua", description: "Micro-learning e microcertificações da OkutiJobs." };

export default async function AcademyPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!auth.user) redirect("/login?next=/academy");
  const { data: profile } = await supabase!.from("profiles").select("account_type").eq("id", auth.user.id).maybeSingle();
  if (profile?.account_type !== "candidate") redirect("/candidato");
  return <AcademyLearnerDashboard />;
}
