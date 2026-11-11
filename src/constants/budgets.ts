export const BUDGET_PERIODS = [{ value: "monthly", label: "Monthly" }] as const;

/** From this share of the limit onward a budget shows "N% used" instead of "On track". */
export const BUDGET_WARN_PERCENT = 80;
/** Alerts fire at these shares of a budget (stored preference; delivery needs the notifications service). */
export const BUDGET_ALERT_PERCENTS = [80, 100] as const;

export const BUDGET_ROUND_TO = 100;
