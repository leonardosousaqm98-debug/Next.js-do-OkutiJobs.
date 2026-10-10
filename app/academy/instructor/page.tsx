import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AcademyInstructorDashboard } from "@/components/academy/AcademyInstructorDashboard";

export const metadata = { title: "Instrutor — OkutiAcademy", description: "Gestão de turmas e progresso OkutiAcademy." };

export default async function AcademyInstructorPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!auth.user) redirect("/login?next=/academy/instructor");
  const { data: instructor } = await supabase!.from("academy_instructors").select("user_id").eq("user_id", auth.user.id).eq("active", true).maybeSingle();
  if (!instructor) redirect("/academy");
  return <AcademyInstructorDashboard />;
}
