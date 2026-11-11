import { z } from "zod";
import { AMOUNT_MAX } from "@/constants/transactions";
import { toneSchema } from "@/features/transactions/schemas";

export const budgetStatusSchema = z.enum(["on-track", "warning", "over"]);
export type BudgetStatus = z.infer<typeof budgetStatusSchema>;

export const budgetItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  tone: toneSchema,
  /** The limit as set by the user. */
  baseLimit: z.number(),
  /** What counts this month: baseLimit plus anything rolled over from last month. */
  limit: z.number(),
  rolledOver: z.number(),
  rollover: z.boolean(),
  period: z.literal("monthly"),
  spent: z.number(),
  /** Negative when over budget. */
  left: z.number(),
  usedPercent: z.number(),
  status: budgetStatusSchema,
});
export type BudgetItem = z.infer<typeof budgetItemSchema>;

export const budgetsOverviewSchema = z.object({
  currency: z.string().length(3),
  /** YYYY-MM */
  month: z.string(),
  /** ISO date the budgets reset. */
  resetsOn: z.string(),
  overall: z.object({
    limit: z.number(),
    spent: z.number(),
    remaining: z.number(),
    usedPercent: z.number(),
    daysLeft: z.number().int(),
    perDay: z.number(),
  }),
  alertsEnabled: z.boolean(),
  items: z.array(budgetItemSchema),
});
export type BudgetsOverview = z.infer<typeof budgetsOverviewSchema>;

/** Request body for POST/PATCH /api/budgets. */
export const budgetInputSchema = z.object({
  category: z.string().min(1, "Choose a category."),
  limit: z
    .number({ message: "Enter a monthly limit." })
    .positive("Enter a limit greater than zero.")
    .max(AMOUNT_MAX, "That amount is too large.")
    .refine(
      (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6,
      "Use at most two decimal places.",
    ),
  period: z.literal("monthly"),
  rollover: z.boolean(),
});
export type BudgetInput = z.infer<typeof budgetInputSchema>;

const amountText = z
  .string()
  .trim()
  .min(1, "Enter an amount.")
  .refine((s) => /^\d[\d,]*(\.\d{0,2})?$/.test(s), "Use digits only, e.g. 10000.")
  .refine((s) => Number(s.replace(/,/g, "")) > 0, "Enter an amount greater than zero.")
  .refine((s) => Number(s.replace(/,/g, "")) <= AMOUNT_MAX, "That amount is too large.");

/** Drawer form: the limit is text so "10,000" can be typed freely. */
export const budgetFormSchema = z.object({
  category: z.string().min(1, "Choose a category."),
  limit: amountText,
  period: z.literal("monthly"),
  rollover: z.boolean(),
});
export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export const overallFormSchema = z.object({ limit: amountText });
export type OverallFormValues = z.infer<typeof overallFormSchema>;

export const toAmount = (text: string) => Number(text.replace(/,/g, ""));

export const settingsSchema = z
  .object({
    overallLimit: z.number().positive().max(AMOUNT_MAX).optional(),
    alertsEnabled: z.boolean().optional(),
  })
  .refine(
    (v) => v.overallLimit !== undefined || v.alertsEnabled !== undefined,
    "Nothing to update.",
  );
