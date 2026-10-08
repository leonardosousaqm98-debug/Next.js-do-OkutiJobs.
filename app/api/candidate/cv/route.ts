import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_BYTES = 10 * 1024 * 1024;
const allowed = new Map([["application/pdf", "pdf"], ["application/msword", "doc"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"]]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });
  const formData = await request.formData(); const file = formData.get("file"); const requestedType = formData.get("documentType"); const documentType = requestedType === "certificate" ? "certificate" : requestedType === "cv_english" ? "cv_english" : "cv";
  if (documentType === "cv" || documentType === "cv_english") { const { count } = await supabase.from("candidate_documents").select("id", { count: "exact", head: true }).eq("candidate_id", authData.user.id).in("document_type", ["cv", "cv_english"]); if ((count ?? 0) >= 2) return NextResponse.json({ error: "Cada candidato pode manter no máximo dois CVs." }, { status: 400 }); }
  if (!(file instanceof File)) return NextResponse.json({ error: "Seleccione um ficheiro PDF, DOC ou DOCX." }, { status: 400 });
  const extension = allowed.get(file.type); if (!extension || file.size > MAX_BYTES) return NextResponse.json({ error: "O ficheiro deve ser PDF, DOC ou DOCX e não pode exceder 10 MB." }, { status: 400 });
  if (file.type === "application/pdf") { const signature = new TextDecoder().decode(new Uint8Array(await file.arrayBuffer()).slice(0, 5)); if (signature !== "%PDF-") return NextResponse.json({ error: "O ficheiro PDF não parece válido." }, { status: 400 }); }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || `documento.${extension}`;
  const path = `${authData.user.id}/${documentType}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("candidate-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "Não foi possível guardar o documento." }, { status: 400 });
  const { error: metadataError } = await supabase.from("candidate_documents").insert({ candidate_id: authData.user.id, storage_path: path, original_name: file.name.slice(0, 255), mime_type: file.type, size_bytes: file.size, document_type: documentType });
  if (metadataError) return NextResponse.json({ error: "O ficheiro foi carregado, mas não foi possível guardar os metadados." }, { status: 500 });
  return NextResponse.json({ ok: true, path, fileName: file.name, documentType });
}

export async function GET() {
  const supabase = await createSupabaseServerClient(); if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser(); if (!authData.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });
  const { data: documents, error } = await supabase.from("candidate_documents").select("id, original_name, mime_type, size_bytes, document_type, created_at, storage_path").eq("candidate_id", authData.user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível consultar os documentos." }, { status: 400 });
  const documentsWithUrls = await Promise.all((documents ?? []).map(async (document) => { const signed = await supabase.storage.from("candidate-documents").createSignedUrl(document.storage_path, 300); return { ...document, downloadUrl: signed.data?.signedUrl ?? null, storage_path: undefined }; }));
  return NextResponse.json({ documents: documentsWithUrls });
}
