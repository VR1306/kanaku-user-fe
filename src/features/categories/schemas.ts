import { z } from "zod";
import { CATEGORY_NAME_MAX } from "@/constants/categories";
import { AMOUNT_MAX } from "@/constants/transactions";
import { toneSchema, transactionTypeSchema } from "@/features/transactions/schemas";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: transactionTypeSchema,
  tone: toneSchema,
  /** Transactions in this category this month. */
  monthCount: z.number().int().min(0),
  /** Total of them this month (positive). */
  monthTotal: z.number(),
  /** Monthly budget for an expense category, if one is set. */
  budget: z.number().nullable(),
  /** True for the "Other" categories that deleted ones fall back to. */
  fallback: z.boolean(),
});
export type CategoryItem = z.infer<typeof categorySchema>;

export const categoriesListSchema = z.object({
  currency: z.string().length(3),
  items: z.array(categorySchema),
});
export type CategoriesList = z.infer<typeof categoriesListSchema>;

const name = z
  .string()
  .trim()
  .min(1, "Give the category a name.")
  .max(CATEGORY_NAME_MAX, `Keep it under ${CATEGORY_NAME_MAX} characters.`);

/** Request body for POST/PUT /api/categories. `budget` is the monthly limit (expense only). */
export const categoryInputSchema = z.object({
  name,
  type: transactionTypeSchema,
  tone: toneSchema,
  budget: z
    .number()
    .positive("Enter an amount greater than zero.")
    .max(AMOUNT_MAX, "That amount is too large.")
    .nullable(),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

/** Request body for PUT /api/categories/:id. Users can only set their own monthly budget. */
export const categoryBudgetSchema = z.object({
  budget: z
    .number()
    .positive("Enter an amount greater than zero.")
    .max(AMOUNT_MAX, "That amount is too large.")
    .nullable(),
});

/** The form keeps the budget as text; empty means "no budget". */
export const categoryFormSchema = z.object({
  name,
  type: transactionTypeSchema,
  tone: toneSchema,
  budget: z
    .string()
    .trim()
    .refine((s) => s === "" || /^\d[\d,]*(\.\d{0,2})?$/.test(s), "Use digits only, e.g. 5000.")
    .refine(
      (s) => s === "" || Number(s.replace(/,/g, "")) > 0,
      "Enter an amount greater than zero.",
    )
    .refine(
      (s) => s === "" || Number(s.replace(/,/g, "")) <= AMOUNT_MAX,
      "That amount is too large.",
    ),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const toCategoryInput = (v: CategoryFormValues): CategoryInput => ({
  name: v.name,
  type: v.type,
  tone: v.tone,
  budget: v.budget === "" ? null : Number(v.budget.replace(/,/g, "")),
});

/** The user-facing form: only the monthly budget is editable (categories are managed by the admin). */
export const budgetFormSchema = categoryFormSchema.pick({ budget: true });
export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
export const toBudget = (v: BudgetFormValues): number | null =>
  v.budget === "" ? null : Number(v.budget.replace(/,/g, ""));
