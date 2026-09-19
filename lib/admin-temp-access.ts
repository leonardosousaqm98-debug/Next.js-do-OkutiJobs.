import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_SECONDS = 15 * 60;
const SUBJECT = "okutijobs-super-admin";

function secret() {
  return process.env.ADMIN_TEMP_ACCESS_SECRET || process.env.JWT_SECRET || "";
}

function signature(timestamp: string) {
  return createHmac("sha256", secret()).update(`${SUBJECT}:${timestamp}`).digest("base64url");
}

export function createTemporaryAdminToken(now = Math.floor(Date.now() / 1000)) {
  const timestamp = String(now);
  return `${timestamp}.${signature(timestamp)}`;
}

export function isValidTemporaryAdminToken(token: string | undefined, now = Math.floor(Date.now() / 1000)) {
  if (!token || !secret()) return false;
  const [timestamp, provided] = token.split(".");
  if (!timestamp || !provided || !/^\d+$/.test(timestamp)) return false;
  const issuedAt = Number(timestamp);
  if (!Number.isSafeInteger(issuedAt) || issuedAt > now + 30 || now - issuedAt > TTL_SECONDS) return false;
  const expected = signature(timestamp);
  const actualBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export const temporaryAdminTtlSeconds = TTL_SECONDS;
