import { describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe("Supabase RLS smoke checks", () => {
  it("does not expose private workflow rows anonymously", async () => {
    expect(url).toBeTruthy();
    expect(anon).toBeTruthy();
    const headers = { apikey: anon!, Authorization: `Bearer ${anon!}` };
    for (const table of ["applications", "messages", "notifications", "talent_favorites", "candidate_documents"]) {
      const response = await fetch(`${url}/rest/v1/${table}?select=*`, { headers });
      expect(response.status, `${table} status`).toBe(200);
      const rows = await response.json();
      expect(rows, `${table} anonymous rows`).toEqual([]);
    }
  }, 15000);
});
