const OKUTIJOBS_EMAIL = /^[^@\s]+@okutijobs\.com$/i;

export function isOkutiCrmEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && OKUTIJOBS_EMAIL.test(email.trim());
}
