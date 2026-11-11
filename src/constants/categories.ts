import type { Tone } from "@/features/transactions/schemas";

/** Colours a category can have. Order is the order shown in the picker. */
export const CATEGORY_COLOURS: { tone: Tone; label: string; swatch: string }[] = [
  { tone: "accent", label: "Cyan", swatch: "#22D3EE" },
  { tone: "brand", label: "Blue", swatch: "#3B82F6" },
  { tone: "danger", label: "Rose", swatch: "#BE123C" },
  { tone: "success", label: "Green", swatch: "#047857" },
  { tone: "violet", label: "Violet", swatch: "#7C3AED" },
  { tone: "slate", label: "Light grey", swatch: "#F6F8FB" },
];

export const CATEGORY_NAME_MAX = 30;

/** When a category is deleted its transactions move here. It can't be deleted or renamed. */
export const FALLBACK_CATEGORY = { expense: "Other", income: "Other income" } as const;
