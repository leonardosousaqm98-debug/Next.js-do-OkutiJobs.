import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("OkutiJobs auth recovery flow", () => {
  it("gives unconfirmed users a resend-confirmation path", () => {
    const source = read("../../components/EmailAuthForm.tsx");
    expect(source).toContain("auth.resend");
    expect(source).toContain("email not confirmed");
    expect(source).toContain("Reenviar");
  });

  it("creates the base profile for a newly authenticated account", () => {
    const source = read("../../app/dashboard/page.tsx");
    expect(source).toContain("from(\"profiles\")");
    expect(source).toContain("upsert");
    expect(source).toContain("account_type: \"candidate\"");
  });
});
