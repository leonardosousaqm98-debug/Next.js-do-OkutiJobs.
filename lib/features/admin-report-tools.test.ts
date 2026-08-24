import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adminPage = readFileSync(new URL("../../app/admin/page.tsx", import.meta.url), "utf8");
const filters = readFileSync(new URL("../../components/AdminFilters.tsx", import.meta.url), "utf8");

describe("admin reporting tools", () => {
  it("connects global rows to searchable filters and CSV export", () => {
    expect(adminPage).toContain("<AdminFilters rows={reportRows} />");
    expect(filters).toContain("Exportar CSV");
    expect(filters).toContain("Módulo");
    expect(filters).toContain("Estado");
  });
});
