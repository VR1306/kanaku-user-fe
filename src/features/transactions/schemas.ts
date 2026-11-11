import { z } from "zod";
import {
  AMOUNT_MAX,
  DATE_RANGES,
  NOTE_MAX_LENGTH,
  PAYMENT_METHODS,
  TITLE_MAX_LENGTH,
  TYPE_FILTERS,
  type TransactionType,
} from "@/constants/transactions";
import { SEARCH_MAX_LENGTH } from "@/constants/search";

export const toneSchema = z.enum(["brand", "accent", "danger", "success", "violet", "slate"]);
export type Tone = z.infer<typeof toneSchema>;

export const transactionTypeSchema = z.enum(["expense", "income"]);

export const transactionSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  method: z.string(),
  /** ISO 8601. */
  date: z.string(),
  /** Negative for expenses, positive for income. */
  amount: z.number(),
  tone: toneSchema,
  /** Repeats every month. May be absent on rows that don't carry it. */
  recurring: z.boolean().optional(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const transactionsSummarySchema = z.object({
  moneyOut: z.number().min(0),
  moneyIn: z.number().min(0),
  net: z.number(),
});

export const transactionsPageSchema = z.object({
  items: z.array(transactionSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  query: z.string(),
  currency: z.string().length(3),
  /** Totals over every match (not just this page). */
  summary: transactionsSummarySchema,
});
export type TransactionsPage = z.infer<typeof transactionsPageSchema>;

const rangeValues = DATE_RANGES.map((r) => r.value) as [string, ...string[]];
const typeFilterValues = TYPE_FILTERS.map((t) => t.value) as [string, ...string[]];

/** Query string accepted by GET /api/transactions (and /export). */
export const transactionsQuerySchema = z.object({
  q: z.string().trim().max(SEARCH_MAX_LENGTH, "Search text is too long.").optional(),
  type: z.enum(typeFilterValues).optional(),
  category: z.string().trim().max(60).optional(),
  method: z.string().trim().max(60).optional(),
  range: z.enum(rangeValues).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
});
export type TransactionsQuery = z.infer<typeof transactionsQuerySchema>;

export const historyEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string(),
  at: z.string(),
});

export const transactionDetailSchema = transactionSchema.extend({
  type: transactionTypeSchema,
  note: z.string(),
  recurring: z.boolean(),
  createdAt: z.string(),
  currency: z.string().length(3),
  history: z.array(historyEntrySchema),
});
export type TransactionDetail = z.infer<typeof transactionDetailSchema>;

/** YYYY-MM-DD in the runtime's local zone, `offsetDays` from today. */
export const localDate = (offsetDays = 0, from = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Fields shared by the form and the API body. `amount` differs (text in the form, number in the API). */
const common = {
  type: transactionTypeSchema,
  category: z.string().min(1, "Choose a category."),
  title: z
    .string()
    .trim()
    .min(1, "Add a short description.")
    .max(TITLE_MAX_LENGTH, `Keep it under ${TITLE_MAX_LENGTH} characters.`),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  method: z.enum(PAYMENT_METHODS, { message: "Choose how it was paid." }),
  note: z.string().trim().max(NOTE_MAX_LENGTH, `Keep notes under ${NOTE_MAX_LENGTH} characters.`),
  recurring: z.boolean(),
};

type Common = {
  type: TransactionType;
  category: string;
  date: string;
  maxDate?: string;
};

function refineCommon(v: Common, ctx: z.RefinementCtx) {
  // One day of slack: the server stores dates in UTC, which can be a day ahead of the browser.
  const max = v.maxDate ?? localDate(1);
  if (v.date > max) {
    ctx.addIssue({ code: "custom", path: ["date"], message: "The date can't be in the future." });
  }
}

/** Request body for POST/PATCH /api/transactions. */
export const transactionInputSchema = z
  .object({
    ...common,
    amount: z
      .number({ message: "Enter an amount." })
      .positive("Enter an amount greater than zero.")
      .max(AMOUNT_MAX, "That amount is too large.")
      .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, {
        message: "Use at most two decimal places.",
      }),
  })
  .superRefine((v, ctx) => {
    const tomorrow = new Date(Date.now() + 36 * 3600_000).toISOString().slice(0, 10);
    refineCommon({ ...v, maxDate: tomorrow }, ctx);
  });
export type TransactionInput = z.infer<typeof transactionInputSchema>;

/** The form keeps the amount as text so people can type "12." or "1,250" freely. */
export const transactionFormSchema = z
  .object({
    ...common,
    amount: z
      .string()
      .trim()
      .min(1, "Enter an amount.")
      .refine((s) => /^\d[\d,]*(\.\d{0,2})?$/.test(s), "Use digits only, e.g. 486 or 486.50.")
      .refine((s) => Number(s.replace(/,/g, "")) > 0, "Enter an amount greater than zero.")
      .refine((s) => Number(s.replace(/,/g, "")) <= AMOUNT_MAX, "That amount is too large."),
  })
  .superRefine((v, ctx) => refineCommon(v, ctx));
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const toInput = (v: TransactionFormValues): TransactionInput => ({
  ...v,
  amount: Number(v.amount.replace(/,/g, "")),
});

export const impactSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("budget"),
    category: z.string(),
    budget: z.number(),
    spent: z.number(),
    left: z.number(),
    usedPercent: z.number(),
  }),
  z.object({ kind: z.literal("income"), category: z.string(), monthIn: z.number() }),
]);
export type Impact = z.infer<typeof impactSchema>;

export const impactQuerySchema = z.object({
  type: transactionTypeSchema,
  category: z.string().trim().min(1).max(60),
  amount: z.coerce.number().min(0).max(AMOUNT_MAX).optional(),
  excludeId: z.string().max(80).optional(),
});

export const idsSchema = z.object({ ids: z.array(z.string().max(80)).min(1).max(100) });
