import { z } from "zod";
import { REPORT_RANGES, DEFAULT_REPORT_RANGE } from "@/constants/reports";
import { toneSchema } from "@/features/transactions/schemas";

export const reportSchema = z.object({
  range: z.enum(REPORT_RANGES.map((r) => r.value) as ["1m", "3m", "6m", "1y"]),
  currency: z.string().length(3),
  /** "June – November 2026" */
  periodLabel: z.string(),
  /** A single month is charted day by day; longer ranges month by month. */
  granularity: z.enum(["day", "month"]),
  summary: z.object({
    totalSpent: z.number(),
    totalSaved: z.number(),
    averagePerMonth: z.number(),
    peak: z
      .object({ label: z.string(), amount: z.number(), unit: z.enum(["day", "month"]) })
      .nullable(),
  }),
  series: z.array(
    z.object({ key: z.string(), label: z.string(), income: z.number(), expenses: z.number() }),
  ),
  categories: z.object({
    currentLabel: z.string(),
    previousLabel: z.string(),
    rows: z.array(
      z.object({
        name: z.string(),
        tone: toneSchema,
        previous: z.number(),
        current: z.number(),
        /** Percent change vs the previous month; null when there was nothing to compare with. */
        changePct: z.number().nullable(),
      }),
    ),
  }),
  insight: z.string().nullable(),
  topMethod: z.object({ name: z.string(), percent: z.number() }).nullable(),
});
export type ReportData = z.infer<typeof reportSchema>;

export const reportQuerySchema = z.object({
  range: z
    .enum(REPORT_RANGES.map((r) => r.value) as ["1m", "3m", "6m", "1y"])
    .default(DEFAULT_REPORT_RANGE),
});
