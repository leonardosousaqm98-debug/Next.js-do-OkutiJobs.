import { describe, expect, it } from "vitest";

describe("NEXT_PUBLIC_APP_URL", () => {
  it("responde a partir da URL configurada da preview", async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    expect(baseUrl).toBe("https://3100-iimi20u3fovrfejf3g9v5-9285947e.us4.manus.computer");
    const response = await fetch(baseUrl!, { method: "GET" });
    expect(response.status).toBeLessThan(500);
  }, 15000);
});
