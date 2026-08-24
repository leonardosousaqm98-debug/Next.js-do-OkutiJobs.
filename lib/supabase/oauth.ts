export function getOAuthRedirectUrl(origin: string, configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL) {
  const base = configuredAppUrl?.trim() || origin;
  return `${base.replace(/\/$/, "")}/auth/callback`;
}
