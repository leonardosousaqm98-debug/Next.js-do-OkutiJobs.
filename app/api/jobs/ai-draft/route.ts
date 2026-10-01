import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LlmResult = { choices?: Array<{ message?: { content?: string } }> };
const schema = {
  type: "object", additionalProperties: false,
  properties: {
    title: { type: "string" }, industry: { type: "string" }, functionalArea: { type: "string" }, seniority: { type: "string" }, workMode: { type: "string" }, contractType: { type: "string" }, country: { type: "string" }, province: { type: "string" }, city: { type: "string" }, nationalities: { type: "array", items: { type: "string" } }, passportRequirements: { type: "array", items: { type: "string" } }, ageMin: { type: "string" }, ageMax: { type: "string" }, drivingCategories: { type: "array", items: { type: "string" } }, certifications: { type: "array", items: { type: "string" } }, hardSkills: { type: "array", items: { type: "string" } }, languages: { type: "array", items: { type: "string" } }, salaryCurrency: { type: "string" }, salaryMin: { type: "string" }, salaryMax: { type: "string" }, benefits: { type: "array", items: { type: "string" } }, description: { type: "string" }, requirements: { type: "string" },
  }, required: ["title","industry","functionalArea","seniority","workMode","contractType","country","province","city","nationalities","passportRequirements","ageMin","ageMax","drivingCategories","certifications","hardSkills","languages","salaryCurrency","salaryMin","salaryMax","benefits","description","requirements"],
} as const;

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não está configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "É necessário iniciar sessão como empresa." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { brief?: unknown };
  const brief = typeof body.brief === "string" ? body.brief.trim().slice(0, 12000) : "";
  if (brief.length < 20) return NextResponse.json({ error: "Descreva pelo menos a função, sector ou requisitos para a IA preencher o anúncio." }, { status: 400 });
  const baseUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/$/, "") || "https://forge.manus.im";
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "A chave de IA ainda não está configurada no ambiente de produção." }, { status: 503 });
  const response = await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ messages: [{ role: "system", content: "És um especialista em recrutamento em Angola e crias anúncios profissionais em português. Extrai apenas informação que esteja explícita ou seja uma inferência segura. Quando faltar informação, devolve string vazia ou array vazio. Não inventes salários, certificações ou requisitos." }, { role: "user", content: `Estrutura o seguinte briefing de uma vaga em campos de anúncio. Responde apenas JSON válido conforme o schema.\n\n${brief}` }], response_format: { type: "json_schema", json_schema: { name: "job_ad_draft", strict: true, schema } } }) });
  if (!response.ok) return NextResponse.json({ error: `A IA não conseguiu preparar o anúncio (${response.status}).` }, { status: 502 });
  const result = await response.json() as LlmResult; const content = result.choices?.[0]?.message?.content;
  if (!content) return NextResponse.json({ error: "A IA não devolveu um anúncio estruturado." }, { status: 502 });
  try { return NextResponse.json({ ok: true, draft: JSON.parse(content) }); } catch { return NextResponse.json({ error: "A resposta da IA não pôde ser convertida em campos." }, { status: 502 }); }
}
