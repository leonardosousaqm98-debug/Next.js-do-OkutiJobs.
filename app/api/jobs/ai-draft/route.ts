import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT = 80_000;

type LlmResult = { choices?: Array<{ message?: { content?: string } }> };

function parseDraft(content: unknown) {
  if (content && typeof content === "object") return content as Record<string, unknown>;
  if (typeof content !== "string") return null;
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
    } catch { return null; }
  }
}

const schema = {
  type: "object", additionalProperties: false,
  properties: {
    title: { type: "string" }, industry: { type: "string" }, functionalArea: { type: "string" }, seniority: { type: "string" }, workMode: { type: "string" }, contractType: { type: "string" }, availability: { type: "string" }, country: { type: "string" }, province: { type: "string" }, city: { type: "string" }, nationalities: { type: "array", items: { type: "string" } }, passportRequirements: { type: "array", items: { type: "string" } }, ageMin: { type: "string" }, ageMax: { type: "string" }, drivingCategories: { type: "array", items: { type: "string" } }, certifications: { type: "array", items: { type: "string" } }, hardSkills: { type: "array", items: { type: "string" } }, languages: { type: "array", items: { type: "string" } }, salaryCurrency: { type: "string" }, salaryMin: { type: "string" }, salaryMax: { type: "string" }, benefits: { type: "array", items: { type: "string" } }, description: { type: "string" }, requirements: { type: "string" },
  }, required: ["title","industry","functionalArea","seniority","workMode","contractType","availability","country","province","city","nationalities","passportRequirements","ageMin","ageMax","drivingCategories","certifications","hardSkills","languages","salaryCurrency","salaryMin","salaryMax","benefits","description","requirements"],
} as const;

async function pdfText(buffer: Buffer) {
  const { spawn } = await import("node:child_process");
  return await new Promise<string>((resolve, reject) => {
    const child = spawn("pdftotext", ["-layout", "-", "-"], { stdio: ["pipe", "pipe", "pipe"] });
    const output: Buffer[] = []; const errors: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => output.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errors.push(chunk));
    child.once("error", reject);
    child.once("close", code => code === 0 ? resolve(Buffer.concat(output).toString("utf8")) : reject(new Error(Buffer.concat(errors).toString("utf8"))));
    child.stdin.end(buffer);
  });
}

async function extractDocument(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    try {
      return await pdfText(buffer);
    } catch {
      // @ts-expect-error pdf-parse 1.x subpath has no declaration
      const parserModule = await import("pdf-parse/lib/pdf-parse.js");
      const parser = parserModule.default ?? parserModule;
      return (await parser(buffer)).text as string;
    }
  }
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ buffer })).value;
  }
  if (name.endsWith(".txt") || file.type.startsWith("text/")) return buffer.toString("utf8");
  throw new Error("Formato não suportado. Carregue PDF, DOCX ou TXT.");
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "É necessário iniciar sessão como empresa." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const briefValue = form?.get("brief");
  const brief = typeof briefValue === "string" ? briefValue.trim() : "";
  const fileValue = form?.get("document");
  let documentText = "";
  let fileName = "";
  if (fileValue instanceof File && fileValue.size > 0) {
    if (fileValue.size > MAX_FILE_BYTES) return NextResponse.json({ error: "O documento não pode ultrapassar 10 MB." }, { status: 400 });
    fileName = fileValue.name;
    try { documentText = (await extractDocument(fileValue)).replace(/\u0000/g, "").trim().slice(0, MAX_TEXT); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível ler o documento." }, { status: 400 }); }
  }
  const source = [brief, documentText ? `DOCUMENTO DE REQUISITOS (${fileName}):\n${documentText}` : ""].filter(Boolean).join("\n\n");
  if (source.length < 20) return NextResponse.json({ error: "Escreva um briefing ou carregue um documento com os requisitos da vaga." }, { status: 400 });
  const baseUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/$/, "") || "https://forge.manus.ai";
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "A chave de IA ainda não está configurada no ambiente de produção." }, { status: 503 });
  const messages = [{ role: "system" as const, content: "És um especialista em recrutamento em Angola. Extrai requisitos explícitos de briefings e documentos de vaga, sem inventar dados. Organiza tudo em português nos campos pedidos. Quando faltar informação, devolve string vazia ou array vazio. Responde apenas JSON." }, { role: "user" as const, content: `Preenche o anúncio estruturado a partir desta informação:\n\n${source}` }];
  const requestLlm = (structured: boolean) => fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ messages, ...(structured ? { response_format: { type: "json_schema", json_schema: { name: "job_ad_draft", strict: true, schema } } } : { response_format: { type: "json_object" } }) }) });
  let response = await requestLlm(true);
  if (!response.ok) {
    const firstError = await response.text().catch(() => "");
    console.warn("[job-ai-draft] structured request failed", response.status, firstError.slice(0, 300));
    response = await requestLlm(false);
  }
  if (!response.ok) {
    const providerError = await response.text().catch(() => "");
    console.error("[job-ai-draft] provider error", response.status, providerError.slice(0, 500));
    return NextResponse.json({ error: `A IA não conseguiu preparar o anúncio (${response.status}). Tente novamente em alguns segundos.` }, { status: 502 });
  }
  const result = await response.json() as LlmResult;
  const draft = parseDraft(result.choices?.[0]?.message?.content);
  if (!draft) return NextResponse.json({ error: "A IA respondeu, mas não devolveu campos reconhecíveis. Tente escrever um briefing mais directo." }, { status: 502 });
  return NextResponse.json({ ok: true, source: fileName ? "document" : "brief", fileName, draft });
}
