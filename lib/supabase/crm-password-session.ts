import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const CRM_PASSWORD_COOKIE_NAME = "okutijobs_crm_access";
export const CRM_PASSWORD_SESSION_TTL_SECONDS = 12 * 60 * 60;

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function sessionKey(sharedPassword: string): Buffer {
  return createHmac("sha256", "okutijobs-crm-session-v1").update(sharedPassword, "utf8").digest();
}

export function verifyCrmSharedPassword(candidate: unknown, configuredPassword: string | undefined): boolean {
  if (typeof candidate !== "string" || !configuredPassword) return false;
  return timingSafeEqual(sha256(candidate), sha256(configuredPassword));
}

export function createCrmPasswordSessionToken(userId: string, sharedPassword: string, nowMs = Date.now()) {
  if (!userId || !sharedPassword) return null;
  const expiresAt = Math.floor(nowMs / 1000) + CRM_PASSWORD_SESSION_TTL_SECONDS;
  const payload = `${userId}:${expiresAt}`;
  const signature = createHmac("sha256", sessionKey(sharedPassword)).update(payload, "utf8").digest("base64url");
  return {
    value: `${expiresAt}.${signature}`,
    maxAge: CRM_PASSWORD_SESSION_TTL_SECONDS,
  };
}

export function verifyCrmPasswordSessionToken(
  token: string | undefined,
  userId: string | undefined,
  sharedPassword: string | undefined,
  nowMs = Date.now(),
): boolean {
  if (!token || !userId || !sharedPassword) return false;
  const [expiresAtText, signature, ...extra] = token.split(".");
  if (extra.length || !/^\d+$/.test(expiresAtText) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return false;

  const expiresAt = Number(expiresAtText);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= nowSeconds || expiresAt > nowSeconds + CRM_PASSWORD_SESSION_TTL_SECONDS + 300) return false;

  const payload = `${userId}:${expiresAt}`;
  const expected = createHmac("sha256", sessionKey(sharedPassword)).update(payload, "utf8").digest("base64url");
  const receivedBytes = Buffer.from(signature, "ascii");
  const expectedBytes = Buffer.from(expected, "ascii");
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}
