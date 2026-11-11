export const REPORT_RANGES = [
  { value: "1m", label: "1M", months: 1 },
  { value: "3m", label: "3M", months: 3 },
  { value: "6m", label: "6M", months: 6 },
  { value: "1y", label: "1Y", months: 12 },
] as const;
export type ReportRange = (typeof REPORT_RANGES)[number]["value"];
export const DEFAULT_REPORT_RANGE: ReportRange = "6m";
