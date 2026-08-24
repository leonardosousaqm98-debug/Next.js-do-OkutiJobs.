import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../../components/MigratedCatalog.tsx", import.meta.url), "utf8");

describe("página de serviços para candidatos", () => {
  it("apresenta copy de carreira e os três acessos rápidos", () => {
    expect(source).toContain("O seu talento merece");
    expect(source).toContain("Encontrar vagas");
    expect(source).toContain("Formações");
    expect(source).toContain("Plano de carreira");
  });

  it("mostra categorias de formação e ligação para o catálogo", () => {
    expect(source).toContain("Escritório e produtividade");
    expect(source).toContain("Contabilidade e finanças");
    expect(source).toContain("Vendas e atendimento");
    expect(source).toContain("Liderança e gestão");
    expect(source).toContain("Ver catálogo completo");
  });
});
