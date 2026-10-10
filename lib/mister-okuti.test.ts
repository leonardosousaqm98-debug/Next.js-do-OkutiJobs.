import { describe, expect, it } from "vitest";
import {
  parseAssistantJson,
  rankJobMatches,
  rankTalentMatches,
  sanitizeJobDraft,
  userContextText,
  wantsJobDraft,
  wantsJobSearch,
  wantsTalentSearch,
} from "./mister-okuti";

describe("Mister Okuti helpers", () => {
  it("detects candidate vacancy and recruiter talent requests", () => {
    expect(wantsJobSearch("Que vagas combinam com o meu perfil?" )).toBe(true);
    expect(wantsTalentSearch("Procuro candidatos com Excel e contabilidade em Luanda.")).toBe(true);
    expect(wantsJobDraft("Ajuda-me a redigir uma vaga de Técnico de Contabilidade.")).toBe(true);
    expect(wantsJobDraft("Como encontro uma vaga de contabilidade?" )).toBe(false);
  });

  it("preserves only a short, recent user context for retrieval", () => {
    const context = userContextText([
      { role: "user", content: "Quero pesquisar vagas." },
      { role: "assistant", content: "Claro, em que área?" },
      { role: "user", content: "Contabilidade em Luanda." },
    ], "Com Excel, se possível.");
    expect(context).toContain("Quero pesquisar vagas.");
    expect(context).toContain("Com Excel, se possível.");
    expect(context).not.toContain("Claro, em que área?");
  });

  it("ranks published jobs using profile skills and the candidate question", () => {
    const matches = rankJobMatches(
      { desired_job_title: "Técnico de Contabilidade", skills: ["Excel"], city: "Luanda" },
      [
        { id: "1", slug: "contabilidade", title: "Técnico de Contabilidade", description: "Contabilidade e Excel", city: "Luanda", published_at: "2026-10-01" },
        { id: "2", slug: "motorista", title: "Motorista", description: "Carta de condução", city: "Benguela", published_at: "2026-10-02" },
      ],
      "Quais vagas de Excel existem em Luanda?",
    );
    expect(matches[0].slug).toBe("contabilidade");
    expect(matches[0].matchTerms).toContain("excel");
    expect(matches[0].score).toBeGreaterThan(matches[1].score);
  });

  it("returns only talent summaries with explicit matching terms", () => {
    const matches = rankTalentMatches([
      { id: "public-1", desired_job_title: "Técnica de Contabilidade", city: "Luanda", skills: ["Excel", "Reconciliação bancária"] },
      { id: "public-2", desired_job_title: "Designer", city: "Benguela", skills: ["Figma"] },
    ], "Procuro candidatos de contabilidade com Excel em Luanda.");
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("public-1");
    expect(matches[0].matchTerms).toContain("Excel");
    expect(matches[0]).not.toHaveProperty("email");
    expect(matches[0]).not.toHaveProperty("phone");
  });

  it("parses JSON responses and removes untrusted or oversized draft fields", () => {
    expect(parseAssistantJson("```json\n{\"reply\":\"Olá\",\"jobDraft\":null}\n```" )?.reply).toBe("Olá");
    expect(parseAssistantJson("Isto não é JSON")).toBeNull();
    const draft = sanitizeJobDraft({
      title: "Técnico de Contabilidade",
      description: "Apoiar o fecho mensal e a reconciliação de contas.",
      requirements: "Experiência em contabilidade e Excel.",
      hardSkills: ["Excel", 4, "Contabilidade"],
      nationalities: ["Angolana"],
      ageMin: "30",
      salaryMin: "".padEnd(100, "9"),
      secret: "campo desconhecido",
    });
    expect(draft?.title).toBe("Técnico de Contabilidade");
    expect((draft?.hardSkills as string[])).toEqual(["Excel", "Contabilidade"]);
    expect(String(draft?.salaryMin)).toHaveLength(30);
    expect(draft?.nationalities).toEqual([]);
    expect(draft?.ageMin).toBe("");
    expect(draft).not.toHaveProperty("secret");
    expect(sanitizeJobDraft({ title: "A", description: "curta" })).toBeNull();
  });
});
