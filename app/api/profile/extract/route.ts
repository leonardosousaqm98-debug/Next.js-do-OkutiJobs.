import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { invokeLlm } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });
  const { data: document, error } = await supabase.from("candidate_documents").select("storage_path, original_name, mime_type").eq("candidate_id", authData.user.id).eq("document_type", "cv").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !document) return NextResponse.json({ error: "Carregue primeiro um CV PDF, DOC ou DOCX privado." }, { status: 400 });
  const { data: signed, error: signedError } = await supabase.storage.from("candidate-documents").createSignedUrl(document.storage_path, 600);
  if (signedError || !signed?.signedUrl) return NextResponse.json({ error: "Não foi possível preparar o CV para análise." }, { status: 400 });
  try {
    const extracted = await invokeLlm([
      { role: "system", content: "És um especialista em recrutamento internacional. Analisa o documento CV anexado e extrai apenas informação explicitamente presente. Nunca inventes datas, empresas, cargos ou contactos. Quando um campo não existir, devolve string vazia ou lista vazia. Converte experiências, formações, certificações, competências e idiomas para as estruturas pedidas. Responde apenas no JSON schema." },
      { role: "user", content: [{ type: "text", text: "Importa automaticamente os dados deste CV para o perfil internacional OkutiJobs. Mantém o idioma original dos nomes próprios, empresas e cursos." }, { type: "file_url", file_url: { url: signed.signedUrl, mime_type: document.mime_type || "application/pdf" } }] },
    ]);
    return NextResponse.json({ ok: true, fileName: document.original_name, extracted });
  } catch (reason: unknown) {
    console.error("CV extraction failed", reason);
    return NextResponse.json({ error: "A importação automática não está disponível neste momento. Pode preencher o perfil manualmente." }, { status: 502 });
  }
}
