type ReviewInput = { profileText?: string; fileUrl?: string; mimeType?: string };
export type CvReview = { score: number; summary: string; strengths: string[]; gaps: string[]; recommendations: string[]; stats: { completeness: number; clarity: number; ats: number; impact: number }; extracted: { headline: string; skills: string[]; experience: string[]; education: string[] } };

export async function invokeCvReview(input: ReviewInput): Promise<CvReview> {
  const baseUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/$/, "") || "https://forge.manus.im";
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!apiKey) throw new Error("LLM não está configurado.");
  const content: Array<{ type: "text"; text: string } | { type: "file_url"; file_url: { url: string; mime_type?: string } }> = [{ type: "text", text: input.profileText?.trim() || "Analisa o CV anexado." }];
  if (input.fileUrl) content.push({ type: "file_url", file_url: { url: input.fileUrl, mime_type: input.mimeType || "application/pdf" } });
  const schema = { type: "object", additionalProperties: false, properties: { score: { type: "integer", minimum: 0, maximum: 100 }, summary: { type: "string" }, strengths: { type: "array", items: { type: "string" } }, gaps: { type: "array", items: { type: "string" } }, recommendations: { type: "array", items: { type: "string" } }, stats: { type: "object", additionalProperties: false, properties: { completeness: { type: "integer", minimum: 0, maximum: 100 }, clarity: { type: "integer", minimum: 0, maximum: 100 }, ats: { type: "integer", minimum: 0, maximum: 100 }, impact: { type: "integer", minimum: 0, maximum: 100 } }, required: ["completeness", "clarity", "ats", "impact"] }, extracted: { type: "object", additionalProperties: false, properties: { headline: { type: "string" }, skills: { type: "array", items: { type: "string" } }, experience: { type: "array", items: { type: "string" } }, education: { type: "array", items: { type: "string" } } }, required: ["headline", "skills", "experience", "education"] } }, required: ["score", "summary", "strengths", "gaps", "recommendations", "stats", "extracted"] };
  const response = await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gemini-3-flash-preview", max_tokens: 8192, messages: [{ role: "system", content: "És o Gemini da OkutiJobs, especialista em recrutamento. Analisa apenas informação explícita, não inventes dados, atribui pontuações justificáveis de 0 a 100 e responde exclusivamente no JSON solicitado." }, { role: "user", content }], response_format: { type: "json_schema", json_schema: { name: "cv_review", strict: true, schema } } }) });
  if (!response.ok) throw new Error("Falha no serviço de análise.");
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = body.choices?.[0]?.message?.content;
  if (!raw) throw new Error("A análise não devolveu dados.");
  return JSON.parse(raw) as CvReview;
}
