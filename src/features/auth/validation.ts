import { PASSWORD_MIN_LENGTH } from "@/constants/auth";

export const PASSWORD_RULES = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (p: string) => p.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "number", label: "One number", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

/** 0 (empty) – 4 (strong). Used by the strength meter. */
export function passwordStrength(password: string): number {
  if (!password) return 0;
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const mixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password) ? 1 : 0;
  return Math.max(1, Math.min(4, passed + mixedCase));
}
