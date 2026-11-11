import { z } from "zod";
import { FREQUENCIES } from "@/constants/recurring";
import { AMOUNT_MAX, PAYMENT_METHODS, TITLE_MAX_LENGTH } from "@/constants/transactions";
import { toneSchema, transactionTypeSchema } from "@/features/transactions/schemas";

const frequencySchema = z.enum(
  FREQUENCIES.map((f) => f.value) as ["weekly", "monthly", "quarterly", "yearly"],
);
const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");

export const recurringItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: transactionTypeSchema,
  category: z.string(),
  method: z.string(),
  tone: toneSchema,
  /** Positive; `type` says whether it is paid or received. */
  amount: z.number(),
  frequency: frequencySchema,
  /** Day of the month it repeats on (for monthly, quarterly and yearly). */
  anchorDay: z.number().int(),
  /** YYYY-MM-DD of the next payment. */
  nextDue: dateText,
  active: z.boolean(),
});
export type RecurringItem = z.infer<typeof recurringItemSchema>;

export const recurringListSchema = z.object({
  currency: z.string().length(3),
  items: z.array(recurringItemSchema),
  summary: z.object({
    /** Active recurring expenses, per month. */
    committed: z.number(),
    /** Active recurring income, per month. */
    income: z.number(),
    next: z.object({ title: z.string(), date: dateText }).nullable(),
  }),
});
export type RecurringList = z.infer<typeof recurringListSchema>;

const common = {
  type: transactionTypeSchema,
  category: z.string().min(1, "Choose a category."),
  title: z
    .string()
    .trim()
    .min(1, "Give it a name.")
    .max(TITLE_MAX_LENGTH, `Keep it under ${TITLE_MAX_LENGTH} characters.`),
  method: z.enum(PAYMENT_METHODS, { message: "Choose how it is paid." }),
  frequency: frequencySchema,
  nextDue: dateText,
};

/** Request body for POST/PUT /api/recurring. */
export const recurringInputSchema = z.object({
  ...common,
  amount: z
    .number({ message: "Enter an amount." })
    .positive("Enter an amount greater than zero.")
    .max(AMOUNT_MAX, "That amount is too large.")
    .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, {
      message: "Use at most two decimal places.",
    }),
});
export type RecurringInput = z.infer<typeof recurringInputSchema>;

/** The form keeps the amount as text so people can type "1,250" freely. */
export const recurringFormSchema = z.object({
  ...common,
  amount: z
    .string()
    .trim()
    .min(1, "Enter an amount.")
    .refine((s) => /^\d[\d,]*(\.\d{0,2})?$/.test(s), "Use digits only, e.g. 649 or 649.50.")
    .refine((s) => Number(s.replace(/,/g, "")) > 0, "Enter an amount greater than zero.")
    .refine((s) => Number(s.replace(/,/g, "")) <= AMOUNT_MAX, "That amount is too large."),
});
export type RecurringFormValues = z.infer<typeof recurringFormSchema>;

export const toRecurringInput = (v: RecurringFormValues): RecurringInput => ({
  ...v,
  amount: Number(v.amount.replace(/,/g, "")),
});

export const recurringPatchSchema = z.object({ active: z.boolean() });
