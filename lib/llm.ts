type MessageContent = string | Array<{ type: "text"; text: string } | { type: "file_url"; file_url: { url: string; mime_type?: string } }>;
type LlmMessage = { role: "system" | "user"; content: MessageContent };
type LlmResponse = { choices?: Array<{ message?: { content?: string } }> };
type Provider =
  | { kind: "openai" | "forge"; key: string; baseUrl: string; model: string }
  | { kind: "gemini"; key: string; model: string };

const stringArray = { type: "array", items: { type: "string" } } as const;
const experienceSchema = { type: "array", items: { type: "object", additionalProperties: false, properties: { role: { type: "string" }, company: { type: "string" }, industry: { type: "string" }, location: { type: "string" }, start: { type: "string" }, end: { type: "string" }, current: { type: "boolean" }, achievements: { type: "string" }, tools: { type: "string" } }, required: ["role", "company", "industry", "location", "start", "end", "current", "achievements", "tools"] } } as const;
const educationSchema = { type: "array", items: { type: "object", additionalProperties: false, properties: { level: { type: "string" }, field: { type: "string" }, institution: { type: "string" }, country: { type: "string" }, start: { type: "string" }, end: { type: "string" }, current: { type: "boolean" } }, required: ["level", "field", "institution", "country", "start", "end", "current"] } } as const;
const certificateSchema = { type: "array", items: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, kind: { type: "string", enum: ["course", "competency"] }, institution: { type: "string" }, issued: { type: "string" }, expiry: { type: "string" }, credential: { type: "string" }, documentName: { type: "string" }, documentId: { type: "string" }, confirmed: { type: "boolean" } }, required: ["name", "kind", "institution", "issued", "expiry", "credential", "documentName", "documentId", "confirmed"] } } as const;
const skillSchema = { type: "array", items: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, level: { type: "string" } }, required: ["name", "level"] } } as const;
const languageSchema = { type: "array", items: { type: "object", additionalProperties: false, properties: { language: { type: "string" }, level: { type: "string" }, cefr: { type: "string" } }, required: ["language", "level", "cefr"] } } as const;
const licenseSchema = { type: "array", items: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, issuer: { type: "string" }, number: { type: "string" }, expiry: { type: "string" } }, required: ["name", "issuer", "number", "expiry"] } } as const;

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    fullName: { type: "string" }, headline: { type: "string" }, bio: { type: "string" }, currentTitle: { type: "string" }, desiredJobTitle: { type: "string" }, seniorityLevel: { type: "string" }, country: { type: "string" }, province: { type: "string" }, city: { type: "string" }, municipality: { type: "string" }, academicLevel: { type: "string" }, studyField: { type: "string" }, emailPrimary: { type: "string" }, phoneWhatsapp: { type: "string" }, linkedinUrl: { type: "string" }, websiteUrl: { type: "string" }, nationality: { type: "string" }, placeOfBirth: { type: "string" }, dateOfBirth: { type: "string" }, passportNumber: { type: "string" }, passportExpiry: { type: "string" }, passportIssuer: { type: "string" }, drivingCategories: stringArray, maritimeBookNumber: { type: "string" }, maritimeRole: { type: "string" }, certifications: stringArray, languages: stringArray, experience: stringArray, education: stringArray, skills: stringArray, softSkills: stringArray, portfolioUrl: { type: "string" }, experiencesStructured: experienceSchema, educationStructured: educationSchema, certificationsStructured: certificateSchema, hardSkills: skillSchema, languageItems: languageSchema,
    professionalLicenses: licenseSchema,
  }, required: ["fullName", "headline", "bio", "currentTitle", "desiredJobTitle", "seniorityLevel", "country", "province", "city", "municipality", "academicLevel", "studyField", "emailPrimary", "phoneWhatsapp", "linkedinUrl", "websiteUrl", "nationality", "placeOfBirth", "dateOfBirth", "passportNumber", "passportExpiry", "passportIssuer", "drivingCategories", "maritimeBookNumber", "maritimeRole", "certifications", "languages", "experience", "education", "skills", "softSkills", "portfolioUrl", "experiencesStructured", "educationStructured", "certificationsStructured", "hardSkills", "languageItems", "professionalLicenses"],
} as const;

function getProvider(): Provider | null {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return {
      kind: "openai",
      key: openAiKey,
      baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
      model: "gpt-4o-mini",
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) return { kind: "gemini", key: geminiKey, model: "gemini-2.5-flash" };

  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY?.trim();
  if (forgeKey) {
    return {
      kind: "forge",
      key: forgeKey,
      baseUrl: (process.env.BUILT_IN_FORGE_API_URL || "https://forge.manus.im").replace(/\/$/, ""),
      model: "gpt-5-mini",
    };
  }
  return null;
}

function toText(content: MessageContent): string {
  if (typeof content === "string") return content;
  return content.map((part) => part.type === "text" ? part.text : `[Documento: ${part.file_url.url}]`).join("\n");
}

const geminiSchemaFields = new Set(["type", "properties", "required", "items", "enum", "description", "format", "nullable"]);
function toGeminiSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toGeminiSchema);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (!geminiSchemaFields.has(key)) continue;
    if (key === "type" && typeof entry === "string") result.type = entry.toUpperCase();
    else if (key === "properties" && entry && typeof entry === "object" && !Array.isArray(entry)) {
      result.properties = Object.fromEntries(Object.entries(entry as Record<string, unknown>).map(([name, property]) => [name, toGeminiSchema(property)]));
    } else result[key] = toGeminiSchema(entry);
  }
  return result;
}

function parseJson(content: string): Record<string, unknown> {
  const cleanContent = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed: unknown = JSON.parse(cleanContent);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("O analisador devolveu um resultado inválido.");
  return parsed as Record<string, unknown>;
}

function upstreamError(status: number): Error {
  if (status === 401 || status === 403) {
    return new Error("A credencial do serviço de IA foi rejeitada. Confirme a chave do fornecedor configurado (OPENAI_API_KEY, GEMINI_API_KEY ou BUILT_IN_FORGE_API_KEY) no ambiente de produção e publique novamente.");
  }
  return new Error(`O serviço de IA devolveu um erro (${status}). Tente novamente mais tarde.`);
}

export async function invokeLlm(messages: LlmMessage[]) {
  const provider = getProvider();
  if (!provider) throw new Error("A importação automática precisa de uma credencial de IA: configure OPENAI_API_KEY, GEMINI_API_KEY ou BUILT_IN_FORGE_API_KEY no ambiente de produção.");
  const signal = AbortSignal.timeout(45_000);
  let response: Response;

  if (provider.kind === "gemini") {
    const systemPrompt = [
      ...messages.filter((message) => message.role === "system").map((message) => toText(message.content)),
      `Responde apenas com um objecto JSON que siga este esquema: ${JSON.stringify(schema)}. Não inventes dados; usa valores vazios quando a informação não constar do CV.`,
    ].join("\n\n");
    const contents = messages.filter((message) => message.role !== "system").map((message) => ({ role: "user", parts: [{ text: toText(message.content) }] }));
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(provider.model)}:generateContent?key=${encodeURIComponent(provider.key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { responseMimeType: "application/json", responseSchema: toGeminiSchema(schema), maxOutputTokens: 8192 },
      }),
    });
    if (!response.ok) {
      console.error("CV extraction model request failed", { provider: provider.kind, status: response.status });
      throw upstreamError(response.status);
    }
    const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const content = body.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    if (!content) throw new Error("O analisador não devolveu dados.");
    return parseJson(content);
  }

  const endpoint = provider.kind === "openai" ? `${provider.baseUrl}/chat/completions` : `${provider.baseUrl}/v1/chat/completions`;
  response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${provider.key}` },
    signal,
    body: JSON.stringify({
      model: provider.model,
      max_completion_tokens: 8192,
      messages,
      response_format: { type: "json_schema", json_schema: { name: "candidate_cv_international", strict: true, schema } },
    }),
  });
  if (!response.ok) {
    console.error("CV extraction model request failed", { provider: provider.kind, status: response.status });
    throw upstreamError(response.status);
  }
  const body = await response.json() as LlmResponse;
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("O analisador não devolveu dados.");
  return parseJson(content);
}
