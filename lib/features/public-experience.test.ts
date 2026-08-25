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

  it("renders the new flat team illustration in the homepage hero", () => {
    expect(home).toContain("flat-hero-illustration");
    expect(home).toContain("/manus-storage/okutijobs-flat-hero-team_d712ae0c.png");
    expect(home).toContain("Equipa de profissionais a trabalhar em conjunto");
    expect(home).not.toContain("art-disc");
    expect(home).not.toContain("AI-powered");
    expect(home).not.toContain("matching</strong>");
  });

  it("removes the requested homepage eyebrow without changing the hero", () => {
    expect(home).not.toContain("Talento angolano. Oportunidades sem fronteiras.");
    expect(home).toContain("O próximo passo da sua carreira");
  });

  it("adds flat illustration interactions for depth, mobile browsing and service guidance", () => {
    expect(catalog).toContain("ParallaxIllustration");
    expect(catalog).toContain("services-carousel");
    expect(catalog).toContain("service-illustration-tooltip");
    expect(catalog).toContain("data-tooltip={service.benefit}");
  });

  it("renders company statistics from per-job Supabase data", () => {
    expect(dashboard).toContain("CompanyJobStat");
    expect(dashboard).toContain("Candidaturas por vaga.");
    expect(dashboard).toContain("analytics-track");
  });
});
