import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../", import.meta.url);

describe("SEO routes", () => {
  it("declares a public sitemap with job detail URLs", () => {
    const source = readFileSync(new URL("app/sitemap.ts", root), "utf8");
    expect(source).toContain('from "next"');
    expect(source).toContain("/vagas/${encodeURIComponent(job.slug)}");
    expect(source).toContain('eq("status", "published")');
  });

  it("blocks private and API areas in robots", () => {
    const source = readFileSync(new URL("app/robots.ts", root), "utf8");
    expect(source).toContain('sitemap: `${baseUrl}/sitemap.xml`');
    expect(source).toContain('"/api/"');
    expect(source).toContain('"/admin"');
  });
});

