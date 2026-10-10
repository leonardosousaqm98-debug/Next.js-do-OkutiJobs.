import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invokeLlm } from "./llm";

const messages = [
  { role: "system" as const, content: "Extrai os dados do CV sem inventar informação." },
  { role: "user" as const, content: "Nome: Ana Exemplo; experiência: técnica de contabilidade." },
];

describe("invokeLlm", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_BASE_URL", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "");
    vi.stubEnv("BUILT_IN_FORGE_API_URL", "");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("usa a chave OpenAI documentada antes de uma chave Forge obsoleta", async () => {
    vi.stubEnv("OPENAI_API_KEY", "openai-test-key");
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "forge-old-key");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ fullName: "Ana Exemplo" }) } }] }), { status: 200 }));

    const result = await invokeLlm(messages);

    expect(result.fullName).toBe("Ana Exemplo");
    expect(fetch).toHaveBeenCalledOnce();
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(new Headers(request?.headers).get("authorization")).toBe("Bearer openai-test-key");
  });

  it("usa o endpoint Gemini e converte o esquema JSON para o formato suportado", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ fullName: "Ana Exemplo" }) }] } }] }), { status: 200 }));

    const result = await invokeLlm(messages);

    expect(result.fullName).toBe("Ana Exemplo");
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
    expect(String(url)).toContain("key=gemini-test-key");
    const body = JSON.parse(String(request?.body)) as { generationConfig: { responseSchema: { type: string; properties: Record<string, { type: string }> } } };
    expect(body.generationConfig.responseSchema.type).toBe("OBJECT");
    expect(body.generationConfig.responseSchema.properties.fullName.type).toBe("STRING");
    expect(JSON.stringify(body.generationConfig.responseSchema)).not.toContain("additionalProperties");
  });

  it("não devolve detalhes brutos do fornecedor quando uma chave é rejeitada", async () => {
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "invalid-test-key");
    vi.mocked(fetch).mockResolvedValue(new Response('{"message":"private provider diagnostic"}', { status: 401 }));

    const error = await invokeLlm(messages).then(() => null, (reason: unknown) => reason as Error);

    expect(error?.message).toContain("A credencial do serviço de IA foi rejeitada");
    expect(error?.message).not.toContain("private provider diagnostic");
  });

  it("explica quando não existe qualquer fornecedor de IA configurado", async () => {
    await expect(invokeLlm(messages)).rejects.toThrow("configure OPENAI_API_KEY, GEMINI_API_KEY ou BUILT_IN_FORGE_API_KEY");
    expect(fetch).not.toHaveBeenCalled();
  });
});
