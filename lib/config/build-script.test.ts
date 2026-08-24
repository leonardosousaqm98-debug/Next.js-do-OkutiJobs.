import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";

describe("production build configuration", () => {
  it("uses production NODE_ENV for Next.js build", () => {
    expect(packageJson.scripts.build).toBe("NODE_ENV=production next build");
  });
});
