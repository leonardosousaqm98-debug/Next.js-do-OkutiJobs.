import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { invokeLlm } from "@/lib/llm";

export const runtime = "nodejs";

const MAX_TEXT = 120_000;

async function extractWithPdftotext(buffer: Buffer) {
  return await new Promise<string>((resolve, reject) => {
    const child = spawn("pdftotext", ["-layout", "-", "-"], { stdio: ["pipe", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    const errors: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errors.push(chunk));
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve(Buffer.concat(chunks).toString("utf8")) : reject(new Error(Buffer.concat(errors).toString("utf8") || `pdftotext terminou com código ${code}`)));
    child.stdin.end(buffer);
  });
}

async function extractPdfText(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Não foi possível descarregar o CV (${response.status}).`);
  const buffer = Buffer.from(await response.arrayBuffer());
  let rawText = "";
  try {
    rawText = await extractWithPdftotext(buffer);
  } catch {
    // Vercel pode não disponibilizar o binário; nesse caso usamos o parser JS.
    // Importar directamente o módulo de execução evita o modo de diagnóstico do entrypoint.
    // @ts-expect-error pdf-parse 1.x não expõe declarações para este subpath.
    const parserModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = parserModule.default ?? parserModule;
    const parsed = await pdfParse(buffer);
    rawText = parsed.text;
  }
  const text = rawText.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim();
  if (text.length < 40) throw new Error("O PDF não contém texto suficiente para análise automática.");
  return text.slice(0, MAX_TEXT);
}

async function extractDocxText(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Não foi possível descarregar o CV (${response.status}).`);
  const buffer = Buffer.from(await response.arrayBuffer());
  // DOCX é um ZIP XML; mammoth extrai apenas o texto, sem enviar o documento
  // privado para o provider como file_url.
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim();
  if (text.length < 40) throw new Error("O documento não contém texto suficiente para análise automática.");
  return text.slice(0, MAX_TEXT);
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "É necessário iniciar sessão." }, { status: 401 });

  const { data: document, error } = await supabase
    .from("candidate_documents")
    .select("storage_path, original_name, mime_type")
    .eq("candidate_id", authData.user.id)
    .eq("document_type", "cv")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !document) return NextResponse.json({ error: "Carregue primeiro um CV PDF, DOC ou DOCX privado." }, { status: 400 });

  const { data: signed, error: signedError } = await supabase.storage.from("candidate-documents").createSignedUrl(document.storage_path, 600);
  if (signedError || !signed?.signedUrl) return NextResponse.json({ error: "Não foi possível preparar o CV para análise." }, { status: 400 });

  try {
    // O caminho principal envia texto já extraído. Isto evita falhas do provider ao
    // tentar interpretar file_url e permite auditar exactamente o conteúdo enviado.
    let sourceText = "";
    const fileName = document.original_name.toLowerCase();
    if (document.mime_type === "application/pdf" || fileName.endsWith(".pdf")) {
      sourceText = await extractPdfText(signed.signedUrl);
    } else if (document.mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.endsWith(".docx")) {
      sourceText = await extractDocxText(signed.signedUrl);
    } else if (fileName.endsWith(".doc") || document.mime_type === "application/msword") {
      throw new Error("O formato DOC antigo não é suportado neste momento. Guarde o ficheiro como DOCX ou PDF e carregue-o novamente.");
    }

    const userContent = sourceText
      ? `Importa automaticamente os dados deste CV para o perfil internacional OkutiJobs. Mantém o idioma original dos nomes próprios, empresas e cursos.\n\nTEXTO BRUTO EXTRAÍDO DO PDF:\n${sourceText}`
      : "Não foi possível extrair texto deste documento. Carregue o CV em PDF ou DOCX.";

    const extracted = await invokeLlm([
      {
        role: "system",
        content: "És um especialista em recrutamento internacional. Analisa apenas informação explicitamente presente. Nunca inventes datas, empresas, cargos ou contactos. Quando um campo não existir, devolve string vazia ou lista vazia. Converte experiências, formações, certificações, competências e idiomas para as estruturas pedidas. Responde apenas no JSON schema.",
      },
      { role: "user", content: userContent },
    ]);
    return NextResponse.json({ ok: true, fileName: document.original_name, extractionMode: sourceText ? "pdf-text" : "document-reference", extracted });
  } catch (reason: unknown) {
    console.error("CV extraction failed", reason);
    const message = reason instanceof Error ? reason.message : "erro desconhecido";
    return NextResponse.json({ error: `A importação automática falhou: ${message}` }, { status: 502 });
  }
}
