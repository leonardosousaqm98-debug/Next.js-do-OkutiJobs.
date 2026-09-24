export function getOAuthRedirectUrl(origin: string) {
  return `${origin.replace(/\/$/, "")}/auth/callback`;
}
