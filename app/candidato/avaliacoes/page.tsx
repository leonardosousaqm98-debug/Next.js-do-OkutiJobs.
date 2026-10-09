import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CandidateAssessments } from "@/components/CandidateAssessments";

export const dynamic = "force-dynamic";
export default async function CandidateAssessmentsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user) redirect("/login");
  return <CandidateAssessments />;
}
