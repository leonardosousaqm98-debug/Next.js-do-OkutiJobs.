import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { kind?: unknown; context?: unknown };
  const kind = body.kind === "experience" ? "responsabilidades e conquistas profissionais" : "resumo profissional / sobre mim";
  const context = typeof body.context === "string" ? body.context.trim().slice(0, 6000) : "";
  if (context.length < 12) return NextResponse.json({ error: "Preencha primeiro alguns dados para a IA trabalhar." }, { status: 400 });
  const baseUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/$/, "") || "https://forge.manus.im";
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "O serviço de IA não está configurado." }, { status: 503 });
  const response = await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-5-mini", temperature: 0.35, messages: [{ role: "system", content: "És um editor de CV profissional. Escreve em português europeu, usa apenas os dados fornecidos, não inventes factos, números, empresas ou competências. Devolve apenas o texto final, sem introdução nem aspas." }, { role: "user", content: `Reescreve ${kind} de forma clara, profissional e adequada a um CV internacional. Dados fornecidos:\n${context}` }] }) });
  if (!response.ok) return NextResponse.json({ error: "A IA não conseguiu preparar o texto. Tente novamente." }, { status: 502 });
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return NextResponse.json({ error: "A IA não devolveu texto." }, { status: 502 });
  return NextResponse.json({ text: text.slice(0, 5000) });
}
