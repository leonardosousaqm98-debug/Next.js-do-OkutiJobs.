import { describe, expect, it } from "vitest";
import { isOkutiCrmEmail } from "./crm-access";

describe("CRM email access", () => {
  it("accepts any address at the exact OkutiJobs domain, case-insensitively", () => {
    expect(isOkutiCrmEmail("ana@okutijobs.com")).toBe(true);
    expect(isOkutiCrmEmail("  suporte@OKUTIJOBS.COM ")).toBe(true);
  });

  it("rejects other domains and lookalike suffixes", () => {
    expect(isOkutiCrmEmail("ana@example.com")).toBe(false);
    expect(isOkutiCrmEmail("ana@okutijobs.com.example.org")).toBe(false);
    expect(isOkutiCrmEmail("ana@sub.okutijobs.com")).toBe(false);
    expect(isOkutiCrmEmail(null)).toBe(false);
    expect(isOkutiCrmEmail(undefined)).toBe(false);
  });
});
