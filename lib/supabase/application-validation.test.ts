import { describe, expect, it } from "vitest";
import { isValidJobId } from "./application-validation";

describe("application contract", () => {
  it("accepts a UUID job id", () => expect(isValidJobId("123e4567-e89b-12d3-a456-426614174000")).toBe(true));
  it("rejects missing and malformed job ids", () => {
    expect(isValidJobId(undefined)).toBe(false);
    expect(isValidJobId("job-demo")).toBe(false);
    expect(isValidJobId(42)).toBe(false);
  });
});
