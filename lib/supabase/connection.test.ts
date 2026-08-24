import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { getOAuthRedirectUrl } from "./oauth";

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe("Supabase connection", () => {
  it("has the public project configuration available", () => {
    expect(projectUrl).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    expect(anonKey).toBeTruthy();
  });

  it("builds OAuth redirects from the configured application origin", () => {
    expect(getOAuthRedirectUrl("https://preview.example.com", "")).toBe("https://preview.example.com/auth/callback");
    expect(getOAuthRedirectUrl("https://preview.example.com", "https://app.okutijobs.com/")).toBe("https://app.okutijobs.com/auth/callback");
    expect(getOAuthRedirectUrl("http://localhost:3000", "https://app.okutijobs.com")).not.toContain("localhost:3000");
  });

  it("reports Google OAuth as enabled", async () => {
    if (!projectUrl || !anonKey) throw new Error("Supabase public configuration is missing");
    const response = await fetch(`${projectUrl}/auth/v1/settings`, { headers: { apikey: anonKey } });
    const payload = (await response.json()) as { external?: { google?: boolean } };
    expect(response.ok).toBe(true);
    expect(payload.external?.google).toBe(true);
  }, 15_000);

  it("generates a Google OAuth URL with the Next.js callback", async () => {
    if (!projectUrl || !anonKey) throw new Error("Supabase public configuration is missing");
    const supabase = createClient(projectUrl, anonKey);
    const redirectTo = getOAuthRedirectUrl("http://localhost:3000");
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } });
    expect(error).toBeNull();
    expect(data.url).toContain("/auth/v1/authorize");
    const expectedRedirect = encodeURIComponent(redirectTo);
    expect(data.url).toContain(`redirect_to=${expectedRedirect}`);
  }, 15_000);

  it("accepts the anon key at the lightweight auth settings endpoint", async () => {
    if (!projectUrl || !anonKey) throw new Error("Supabase public configuration is missing");
    const response = await fetch(`${projectUrl}/auth/v1/settings`, { headers: { apikey: anonKey } });
    expect(response.ok).toBe(true);
    const payload = (await response.json()) as { external?: Record<string, boolean> };
    expect(payload).toHaveProperty("external");
  }, 15_000);
});
