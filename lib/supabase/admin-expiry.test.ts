import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../../app/api/admin/expire-jobs/route.ts", import.meta.url), "utf8");

describe("admin job expiry", () => {
  it("uses the MFA-protected admin guard and notifies affected companies", () => {
    expect(source).toContain("getAdminApiContext");
    expect(source).toContain("notifications");
    expect(source).toContain("admin_audit_logs");
    expect(source).toContain("expires_at");
  });
});
