import { describe, expect, it } from "vitest";
import {
  createCrmPasswordSessionToken,
  CRM_PASSWORD_SESSION_TTL_SECONDS,
  verifyCrmPasswordSessionToken,
  verifyCrmSharedPassword,
} from "./crm-password-session";

const secret = "crm-test-password-123";
const now = 1_800_000_000_000;

describe("CRM shared-password access", () => {
  it("compares the submitted password exactly", () => {
    expect(verifyCrmSharedPassword(secret, secret)).toBe(true);
    expect(verifyCrmSharedPassword(`${secret} `, secret)).toBe(false);
    expect(verifyCrmSharedPassword("wrong", secret)).toBe(false);
    expect(verifyCrmSharedPassword(secret, undefined)).toBe(false);
    expect(verifyCrmSharedPassword(null, secret)).toBe(false);
  });

  it("issues a signed session bound to one authenticated user", () => {
    const session = createCrmPasswordSessionToken("user-1", secret, now);
    expect(session).not.toBeNull();
    expect(session?.maxAge).toBe(CRM_PASSWORD_SESSION_TTL_SECONDS);
    expect(verifyCrmPasswordSessionToken(session?.value, "user-1", secret, now)).toBe(true);
    expect(verifyCrmPasswordSessionToken(session?.value, "user-2", secret, now)).toBe(false);
    expect(verifyCrmPasswordSessionToken(session?.value, "user-1", "different-password", now)).toBe(false);
  });

  it("rejects a tampered or expired cookie", () => {
    const session = createCrmPasswordSessionToken("user-1", secret, now);
    expect(verifyCrmPasswordSessionToken(`${session?.value}x`, "user-1", secret, now)).toBe(false);
    expect(verifyCrmPasswordSessionToken(session?.value, "user-1", secret, now + CRM_PASSWORD_SESSION_TTL_SECONDS * 1000)).toBe(false);
    expect(verifyCrmPasswordSessionToken(undefined, "user-1", secret, now)).toBe(false);
  });
});
