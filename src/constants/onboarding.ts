import { EXPENSE_CATEGORIES } from "./transactions";

export const ONBOARDING_STEPS = 3;

export const CURRENCIES = [{ value: "INR", label: "₹ Indian Rupee (INR)" }] as const;

const ordinal = (n: number) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10]}`;
};

/** "Salary credited on": day of month, or the last day. 0 = last day. */
export const SALARY_DAYS = [
  ...Array.from({ length: 28 }, (_, i) => ({
    value: String(i + 1),
    label: `${ordinal(i + 1)} of every month`,
  })),
  { value: "0", label: "Last day of every month" },
];

export const SAVINGS_GOALS = [
  { value: "0", label: "No savings goal" },
  ...[10, 20, 30, 40, 50].map((p) => ({ value: String(p), label: `Save ${p}% of income` })),
];

/** Chips on step 2. The first seven are pre-selected, as in the design. */
export const ONBOARDING_CATEGORIES = EXPENSE_CATEGORIES.filter((c) => c.name !== "Other").map(
  (c) => c.name,
);
export const DEFAULT_ONBOARDING_CATEGORIES = [
  "Food & dining",
  "Rent",
  "Transport",
  "Shopping",
  "Bills & utilities",
  "Health",
  "Entertainment",
];

export const DEFAULT_MONTHLY_BUDGET = 50_000;

/**
 * Relative weights used to split the overall budget into starting category limits
 * (editable afterwards on the Budgets screen).
 */
export const SUGGESTED_BUDGET_WEIGHTS: Record<string, number> = {
  Rent: 30,
  "Food & dining": 20,
  Transport: 10,
  Shopping: 8,
  "Bills & utilities": 10,
  Health: 5,
  Entertainment: 5,
  Education: 6,
  Travel: 5,
  Gifts: 3,
  Investments: 10,
  Pets: 3,
};
