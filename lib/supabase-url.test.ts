import { describe, expect, it } from "vitest";
import { getValidSupabaseUrl } from "./supabase-url";

describe("getValidSupabaseUrl", () => {
  it("accepts an HTTPS Supabase URL and removes the trailing slash", () => {
    expect(getValidSupabaseUrl(" https://example.supabase.co/ ")).toBe("https://example.supabase.co");
  });

  it("accepts HTTP URLs for local development", () => {
    expect(getValidSupabaseUrl("http://localhost:54321")).toBe("http://localhost:54321");
  });

  it("returns null for malformed, empty, or unsupported values", () => {
    expect(getValidSupabaseUrl(undefined)).toBeNull();
    expect(getValidSupabaseUrl("not-a-url")).toBeNull();
    expect(getValidSupabaseUrl("ftp://example.supabase.co")).toBeNull();
  });
});
