import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const modal = readFileSync(new URL("../../components/AudienceChoiceModal.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

describe("escolha inicial de utilizador", () => {
  it("oferece os percursos de candidato, empresa e exploração", () => {
    expect(modal).toContain("Sou candidato");
    expect(modal).toContain("Sou empregador / empresa");
    expect(modal).toContain("Apenas visitar e explorar a plataforma");
    expect(modal).toContain("okutijobs-audience-choice");
  });

  it("é montada na homepage nova", () => {
    expect(home).toContain("<AudienceChoiceModal />");
  });
});
