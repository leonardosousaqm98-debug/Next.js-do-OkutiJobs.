import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { invokeCvReview } from "@/lib/cv-review";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { profileText?: unknown } | null;
  const profileText = typeof body?.profileText === "string" ? body.profileText.trim().slice(0, 18000) : "";
  let fileUrl: string | undefined; let mimeType: string | undefined; let hasStoredCv = false;
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data: document } = await supabase.from("candidate_documents").select("storage_path, mime_type").eq("candidate_id", auth.user.id).eq("document_type", "cv").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (document?.storage_path) { hasStoredCv = true; const signed = await supabase.storage.from("candidate-documents").createSignedUrl(document.storage_path, 600); fileUrl = signed.data?.signedUrl; mimeType = document.mime_type || "application/pdf"; }
    }
  }
  if (profileText.length < 40 && !hasStoredCv) return NextResponse.json({ error: "Escreva pelo menos 40 caracteres ou anexe um CV PDF depois de iniciar sessão." }, { status: 400 });
  try { return NextResponse.json({ ok: true, review: await invokeCvReview({ profileText, fileUrl, mimeType }) }); }
  catch (error) { console.error("CV review failed", error); return NextResponse.json({ error: "A análise automática não está disponível neste momento. Tente novamente." }, { status: 502 }); }
}
