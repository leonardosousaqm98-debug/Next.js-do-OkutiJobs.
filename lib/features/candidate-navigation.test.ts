import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("candidate-focused navigation", () => {
  it("exposes the requested candidate services", () => {
    const source = read("components/SiteHeader.tsx");
    expect(source).toContain('Comprar CV');
    expect(source).toContain('Apoio à candidatura');
    expect(source).toContain('<summary>Serviços</summary>');
    expect(source).toContain('Revisão de CV por IA');
    expect(source).toContain('Oportunidades compatíveis');
    expect(source).toContain('Formações de carreira');
    expect(source).toContain('className="mobile-nav-dropdown"');
    expect(source).toContain('aria-label="Abrir menu"');
  });

  it("does not expose the retired audience links in the shared header", () => {
    const source = read("components/SiteHeader.tsx");
    expect(source).not.toContain('Para candidatos');
    expect(source).not.toContain('Para empresas');
    expect(source).not.toContain('Para profissionais');
  });

  it("provides a back button with history and homepage fallback", () => {
    expect(read("components/SiteHeader.tsx")).toContain("<BackButton />");
    const backButton = read("components/BackButton.tsx");
    expect(backButton).toContain("router.back()");
    expect(backButton).toContain('router.push("/")');
    expect(backButton).toContain("Voltar à página anterior");
  });

  it("uses the shared header on the homepage and public catalog", () => {
    expect(read("app/page.tsx")).toContain('<SiteHeader signedIn={Boolean(data.user)} />');
    expect(read("components/MigratedCatalog.tsx")).toContain('function Header() { return <SiteHeader />; }');
    expect(read("components/PublicInfoPages.tsx")).toContain('function Header() { return <SiteHeader />; }');
  });
});
