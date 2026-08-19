export const PASSWORD_RULES = [
  {
    id: "length",
    label: "8+ characters",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "number",
    label: "One number",
    test: (value: string) => /\d/.test(value),
  },
  {
    id: "special",
    label: "One special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

export function passwordMeetsRules(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}
