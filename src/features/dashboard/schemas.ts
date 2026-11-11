import { z } from "zod";
import { toneSchema, transactionSchema, type Tone } from "@/features/transactions/schemas";

export { toneSchema };
export type { Tone };

const month = z.string().regex(/^\d{4}-\d{2}$/);

export const dashboardSchema = z.object({
  month,
  asOf: z.string(),
  currency: z.string().length(3),
  unreadNotifications: z.number().int().min(0),
  summary: z.object({
    spent: z.number(),
    income: z.number(),
    saved: z.number(),
    /** Percent of income saved, one decimal. */
    savingsRate: z.number(),
    /** Spending change vs the previous month in percent; null when there is no prior month. */
    changeVsPreviousPct: z.number().nullable(),
    previousMonthLabel: z.string(),
  }),
  budget: z.object({
    total: z.number(),
    used: z.number(),
    remaining: z.number(),
    usedPct: z.number(),
    /** Days left in the month (0 once the month is over). */
    daysLeft: z.number().int().min(0),
    safeToSpendPerDay: z.number().nullable(),
  }),
  monthlySpending: z.array(z.object({ month, label: z.string(), amount: z.number() })),
  breakdown: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number(),
      percent: z.number(),
      tone: toneSchema,
    }),
  ),
  recentTransactions: z.array(transactionSchema),
  categoryBudgets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      spent: z.number(),
      limit: z.number(),
      status: z.enum(["ok", "warning", "exceeded"]),
      overBy: z.number(),
    }),
  ),
  upcomingBills: z.array(
    z.object({ id: z.string(), title: z.string(), dueDate: z.string(), amount: z.number() }),
  ),
});

export type DashboardData = z.infer<typeof dashboardSchema>;
export type DashboardMeta = { source: "database" };

export const dashboardQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must look like 2026-11")
    .optional(),
});
