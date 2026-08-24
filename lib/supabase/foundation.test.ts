import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (file: string) => readFileSync(new URL(`./${file}`, import.meta.url), "utf8");

describe("Supabase foundation", () => {
  it("keeps the admin client server-only", () => {
    const source = read("admin.ts");
    expect(source).toContain('import "server-only"');
    expect(source).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  });

  it("uses a private bucket and validates PDF CV uploads", () => {
    const source = read("candidate-documents.ts");
    expect(source).toContain('from("candidate-documents")');
    expect(source).toContain('file.type !== "application/pdf"');
    expect(source).toContain("10 * 1024 * 1024");
    expect(source).toContain("createSignedUrl");
  });

  it("allows browser extensions to add html attributes without hydration noise", () => {
    const layout = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");
    expect(layout).toContain("suppressHydrationWarning");
    expect(layout).toContain('<html lang="pt"');
  });

  it("keeps the OAuth callback on the configured public origin", () => {
    const callback = readFileSync(new URL("../../app/auth/callback/route.ts", import.meta.url), "utf8");
    expect(callback).toContain("NEXT_PUBLIC_APP_URL");
    expect(callback).toContain('next.startsWith("/")');
    expect(callback).toContain('!next.startsWith("//")');
  });

  it("exposes the Google OAuth flow and validates callback redirects", () => {
    const login = readFileSync(new URL("../../app/login/page.tsx", import.meta.url), "utf8");
    const callback = readFileSync(new URL("../../app/auth/callback/route.ts", import.meta.url), "utf8");
    expect(login).toContain("EmailAuthForm");
    expect(login).not.toContain("GoogleLoginButton");
    expect(callback).toContain("exchangeCodeForSession");
    expect(callback).toContain('!next.startsWith("//")');
  });

  it("documents coexistence and migration order", () => {
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
    expect(readme).toContain("React/Vite");
    expect(readme).toContain("Migração progressiva");
    expect(readme).toContain("RLS");
  });
});
