import { describe, expect, it } from "vitest";

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe("Supabase server connection", () => {
  it("accepts the server-only service role for Storage administration", async () => {
    if (!projectUrl || !serviceRole) throw new Error("Supabase server configuration is missing");
    const response = await fetch(`${projectUrl}/storage/v1/bucket`, {
      headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` },
    });
    expect(response.ok).toBe(true);
    const buckets = (await response.json()) as Array<{ name?: string; public?: boolean }>;
    const candidateDocuments = buckets.find((bucket) => bucket.name === "candidate-documents");
    expect(candidateDocuments).toBeDefined();
    expect(candidateDocuments?.public).toBe(false);
  }, 15_000);
});
