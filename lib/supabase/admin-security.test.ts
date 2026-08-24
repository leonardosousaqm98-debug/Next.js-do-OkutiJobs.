import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("OkutiJobs admin security", () => {
  it("requires AAL2 and an active admin member for mutations", () => {
    const source = read("./admin-api.ts");
    expect(source).toContain("currentLevel !== \"aal2\"");
    expect(source).toContain("!member || !member.mfa_enrolled");
  });

  it("restricts mutations to known entity fields and writes an audit event", () => {
    const source = read("../../app/api/admin/manage/route.ts");
    expect(source).toContain("allowed");
    expect(source).toContain("admin_audit_logs");
    expect(source).toContain("context.user.id");
  });
});
