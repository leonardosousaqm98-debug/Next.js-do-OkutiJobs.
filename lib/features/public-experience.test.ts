import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSearch = readFileSync(new URL("../../components/HomeSearch.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../../components/MigratedCatalog.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../../components/PortalDashboard.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const mascot = readFileSync(new URL("../../components/MascotHero.tsx", import.meta.url), "utf8");

describe("OkutiJobs public discovery and company analytics", () => {
  it("keeps homepage search controls for category and location", () => {
    expect(homeSearch).toContain("Filtrar por categoria");
    expect(homeSearch).toContain("Cidade ou província");
    expect(homeSearch).toContain("search-match-list");
  });

  it("presents requirements and a prominent application action on job details", () => {
    expect(catalog).toContain("Requisitos da vaga");
    expect(catalog).toContain("Candidatar-me a esta vaga");
    expect(catalog).toContain("requirements-list");
  });

  it("renders the modern company services experience", () => {
    expect(catalog).toContain("Soluções para organizações em movimento");
    expect(catalog).toContain("company-service-grid");
    expect(catalog).toContain("Recrutamento especializado");
    expect(catalog).toContain("Avaliação e testes");
    expect(catalog).toContain("Solicitar uma proposta");
  });

  it("renders the OkutiJobs mascot in the homepage hero", () => {
    expect(home).toContain("MascotHero");
    expect(mascot).toContain("/manus-storage/okutijobs-career-mascot-office-v2_da857c8c.png");
    expect(mascot).toContain("Mascote OkutiJobs a dar as boas-vindas aos profissionais");
    expect(mascot).toContain("hero-mascot");
    expect(mascot).toContain("onError");
    expect(home).not.toContain("art-disc");
    expect(home).not.toContain("AI-powered");
    expect(home).not.toContain("matching</strong>");
  });

  it("removes the requested homepage eyebrow without changing the hero", () => {
    expect(home).not.toContain("Talento angolano. Oportunidades sem fronteiras.");
    expect(home).toContain("O próximo passo da sua carreira");
  });

  it("renders company statistics from per-job Supabase data", () => {
    expect(dashboard).toContain("CompanyJobStat");
    expect(dashboard).toContain("Candidaturas por vaga.");
    expect(dashboard).toContain("analytics-track");
  });
});
