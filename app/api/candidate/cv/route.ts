import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_CV_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Seleccione um ficheiro PDF." }, { status: 400 });
  if (file.type !== "application/pdf" || file.size > MAX_CV_BYTES) return NextResponse.json({ error: "O CV deve ser PDF e não pode exceder 10 MB." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const signature = new TextDecoder().decode(bytes.slice(0, 5));
  if (signature !== "%PDF-") return NextResponse.json({ error: "O ficheiro não parece ser um PDF válido." }, { status: 400 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "cv.pdf";
  const path = `${authData.user.id}/cv/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("candidate-documents").upload(path, file, { contentType: "application/pdf", upsert: false });
  if (uploadError) return NextResponse.json({ error: "Não foi possível guardar o CV." }, { status: 400 });

  const { error: metadataError } = await supabase.from("candidate_documents").insert({ candidate_id: authData.user.id, storage_path: path, original_name: file.name.slice(0, 255), mime_type: "application/pdf", size_bytes: file.size, document_type: "cv" });
  if (metadataError) return NextResponse.json({ error: "O ficheiro foi carregado, mas não foi possível guardar os metadados." }, { status: 500 });

  return NextResponse.json({ ok: true, path, fileName: file.name });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });

  const { data: documents, error } = await supabase.from("candidate_documents").select("id, original_name, mime_type, size_bytes, created_at, storage_path").eq("candidate_id", authData.user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível consultar os documentos." }, { status: 400 });
  const documentsWithUrls = await Promise.all((documents ?? []).map(async (document) => {
    const signed = await supabase.storage.from("candidate-documents").createSignedUrl(document.storage_path, 300);
    return { ...document, downloadUrl: signed.data?.signedUrl ?? null, storage_path: undefined };
  }));
  return NextResponse.json({ documents: documentsWithUrls });
}
