type MessageContent = string | Array<{ type: "text"; text: string } | { type: "file_url"; file_url: { url: string; mime_type?: string } }>;

type LlmResponse = { choices?: Array<{ message?: { content?: string } }> };

export async function invokeLlm(messages: Array<{ role: "system" | "user"; content: MessageContent }>) {
  const baseUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/$/, "") || "https://forge.manus.im";
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!apiKey) throw new Error("LLM não está configurado no ambiente server-side.");
  const response = await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ messages, response_format: { type: "json_schema", json_schema: { name: "candidate_cv", strict: true, schema: { type: "object", additionalProperties: false, properties: { fullName: { type: "string" }, headline: { type: "string" }, bio: { type: "string" }, currentTitle: { type: "string" }, country: { type: "string" }, province: { type: "string" }, city: { type: "string" }, academicLevel: { type: "string" }, studyField: { type: "string" }, certifications: { type: "array", items: { type: "string" } }, languages: { type: "array", items: { type: "string" } }, experience: { type: "array", items: { type: "string" } }, education: { type: "array", items: { type: "string" } }, skills: { type: "array", items: { type: "string" } }, portfolioUrl: { type: "string" } }, required: ["fullName", "headline", "bio", "currentTitle", "country", "province", "city", "academicLevel", "studyField", "certifications", "languages", "experience", "education", "skills", "portfolioUrl"] } } } }) });
  if (!response.ok) throw new Error(`Falha na análise do CV (${response.status}).`);
  const result = (await response.json()) as LlmResponse;
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("O analisador não devolveu dados.");
  return JSON.parse(content) as Record<string, unknown>;
}
