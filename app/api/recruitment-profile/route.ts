import { NextResponse } from "next/server";

export const runtime = "nodejs";
const maxText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const schema = { type: "object", additionalProperties: false, properties: { role: { type: "string" }, seniority: { type: "string" }, experience: { type: "string" }, education: { type: "string" }, responsibilities: { type: "string" }, skills: { type: "string" }, salary: { type: "string" }, sourceText: { type: "string" } }, required: ["role", "seniority", "experience", "education", "responsibilities", "skills", "salary", "sourceText"] };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const description = maxText(body?.description, 12000);
  const fileData = maxText(body?.fileData, 11_500_000);
  const fileName = maxText(body?.fileName, 160);
  if (!description && !fileData) return NextResponse.json({ error: "Envie uma JD ou escreva a descrição do perfil." }, { status: 400 });
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  const baseUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/$/, "") || "https://forge.manus.im";
  if (!apiKey) return NextResponse.json({ error: "O Gemini não está configurado neste momento." }, { status: 503 });
  const content: Array<Record<string, unknown>> = [{ type: "text", text: `Estrutura este briefing de recrutamento em português. Extrai apenas informação explícita, não inventes requisitos e deixa campos vazios quando não existirem. Nome do ficheiro: ${fileName || "sem anexo"}. Briefing escrito:\n${description || "(ver documento anexo)"}` }];
  if (fileData) content.push({ type: "file_url", file_url: { url: fileData, mime_type: fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream" } });
  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gemini-3-flash-preview", max_tokens: 5000, messages: [{ role: "system", content: "És um consultor sénior de recrutamento. Responde exclusivamente com o JSON solicitado." }, { role: "user", content }], response_format: { type: "json_schema", json_schema: { name: "recruitment_profile", strict: true, schema } } }) });
    if (!response.ok) throw new Error(`Gemini ${response.status}`);
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = result.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Resposta vazia");
    const profile = JSON.parse(raw) as Record<string, unknown>;
    return NextResponse.json({ ok: true, profile, sourceText: typeof profile.sourceText === "string" ? profile.sourceText : description });
  } catch (error) { console.error("Recruitment profile analysis failed", error); return NextResponse.json({ error: "Não foi possível estruturar o perfil agora. Pode preencher os campos manualmente." }, { status: 502 }); }
}
