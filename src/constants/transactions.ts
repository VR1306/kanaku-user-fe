import type { Tone } from "@/features/transactions/schemas";

export type TransactionType = "expense" | "income";

export const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

/** Category -> display tone. Order is the order shown in the pickers. */
export const EXPENSE_CATEGORIES = [
  { name: "Food & dining", short: "Food", tone: "accent" },
  { name: "Transport", short: "Transport", tone: "success" },
  { name: "Shopping", short: "Shopping", tone: "danger" },
  { name: "Bills & utilities", short: "Bills", tone: "violet" },
  { name: "Rent", short: "Rent", tone: "brand" },
  { name: "Health", short: "Health", tone: "success" },
  { name: "Entertainment", short: "Fun", tone: "brand" },
  { name: "Education", short: "Education", tone: "accent" },
  { name: "Travel", short: "Travel", tone: "success" },
  { name: "Gifts", short: "Gifts", tone: "violet" },
  { name: "Investments", short: "Invest", tone: "brand" },
  { name: "Pets", short: "Pets", tone: "danger" },
  { name: "Other", short: "Other", tone: "slate" },
] as const satisfies readonly { name: string; short: string; tone: Tone }[];

export const INCOME_CATEGORIES = [
  { name: "Salary", short: "Salary", tone: "brand" },
  { name: "Freelance", short: "Freelance", tone: "accent" },
  { name: "Interest", short: "Interest", tone: "success" },
  { name: "Gift", short: "Gift", tone: "violet" },
] as const satisfies readonly { name: string; short: string; tone: Tone }[];

export const CATEGORIES: Record<
  TransactionType,
  readonly { name: string; short: string; tone: Tone }[]
> = { expense: EXPENSE_CATEGORIES, income: INCOME_CATEGORIES };

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const categoryTone = (name: string): Tone =>
  ALL_CATEGORIES.find((c) => c.name === name)?.tone ?? "slate";

export const PAYMENT_METHODS = [
  "UPI",
  "Cash",
  "Debit card",
  "Credit card",
  "Net banking",
  "Bank transfer",
] as const;
/** Methods offered in the add/edit form per type (bank transfer is the usual way income arrives). */
export const METHODS_BY_TYPE: Record<TransactionType, readonly (typeof PAYMENT_METHODS)[number][]> =
  {
    expense: ["UPI", "Cash", "Debit card", "Credit card", "Net banking"],
    income: ["Bank transfer", "UPI", "Cash", "Net banking"],
  };

export const DATE_RANGES = [
  { value: "all", label: "All time" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-30", label: "Last 30 days" },
  { value: "last-90", label: "Last 90 days" },
] as const;
export type DateRange = (typeof DATE_RANGES)[number]["value"];

export const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "expense", label: "Expenses" },
  { value: "income", label: "Income" },
] as const;
export type TypeFilter = (typeof TYPE_FILTERS)[number]["value"];

export const NOTE_MAX_LENGTH = 280;
export const TITLE_MAX_LENGTH = 80;
export const AMOUNT_MAX = 100_000_000;

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
export const RECEIPT_TYPES = ["image/jpeg", "image/png", "application/pdf"];

/** One-tap presets on the "New transaction" screen. */
export const QUICK_ADD = [
  { title: "Morning coffee", amount: 120, category: "Food & dining", method: "UPI" },
  { title: "Cab to office", amount: 312, category: "Transport", method: "UPI" },
  { title: "Metro recharge", amount: 500, category: "Transport", method: "UPI" },
] as const;
