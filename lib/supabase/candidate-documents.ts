import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_CV_BYTES = 10 * 1024 * 1024;

export async function uploadCandidateCv(candidateId: string, file: File) {
  if (file.type !== "application/pdf") throw new Error("O CV deve estar em formato PDF.");
  if (file.size > MAX_CV_BYTES) throw new Error("O CV não pode exceder 10 MB.");

  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase ainda não está configurado no servidor.");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${candidateId}/cv/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("candidate-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Não foi possível guardar o CV: ${error.message}`);
  return { path, bucket: "candidate-documents" };
}

export async function createCandidateCvDownloadUrl(path: string, expiresInSeconds = 300) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase ainda não está configurado no servidor.");
  const { data, error } = await supabase.storage.from("candidate-documents").createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) throw new Error("Não foi possível gerar o acesso temporário ao CV.");
  return data.signedUrl;
}
