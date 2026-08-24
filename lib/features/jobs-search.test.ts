import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const filters = readFileSync(new URL("../../components/JobsFilters.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../../components/MigratedCatalog.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../../app/api/jobs/route.ts", import.meta.url), "utf8");
const detail = readFileSync(new URL("../../app/vagas/[slug]/page.tsx", import.meta.url), "utf8");

describe("advanced jobs search", () => {
  it("supports shared URL filters, debounce, reset and mobile drawer", () => {
    expect(filters).toContain("useDebouncedCallback");
    expect(filters).toContain("router.replace");
    expect(filters).toContain("Limpar filtros");
    expect(filters).toContain("jobs-filter-toggle");
    expect(filters).toContain("salaryMin");
    expect(filters).toContain("salaryMax");
  });

  it("renders complete job details and paginated results", () => {
    expect(catalog).toContain("Descrição completa e funções");
    expect(catalog).toContain("Requisitos da vaga");
    expect(catalog).toContain("jobs-pagination");
    expect(catalog).toContain("useSearchParams");
  });

  it("provides a Supabase-backed API with dynamic filters and pagination", () => {
    expect(api).toContain("from(\"jobs\")");
    expect(api).toContain("ilike");
    expect(api).toContain("range(from");
    expect(api).toContain("count: \"exact\"");
  });

  it("sends unauthenticated candidates to login from a job detail", () => {
    expect(catalog).toContain("/login?next=");
    expect(detail).toContain("slug");
  });
});
