/** Locale-aware formatters. All take plain values so they are easy to test. */

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    // Whole rupees stay clean (₹486); paise only appear when there are some (₹486.50).
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** 38420 -> "38.4k" (used on chart labels). */
export function formatCompact(amount: number): string {
  return Math.abs(amount) >= 1000 ? `${(amount / 1000).toFixed(1)}k` : String(Math.round(amount));
}

export const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

/** "2026-11" -> "November 2026" */
export function formatMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1),
  );
}

/** Last `count` month keys, newest first, starting at `from`. */
export function recentMonths(from: Date, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    toMonthKey(new Date(from.getFullYear(), from.getMonth() - i, 1)),
  );
}

/** "THURSDAY, 5 NOVEMBER" */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" })
    .format(date)
    .replace(/^(\w+) /, "$1, ")
    .toUpperCase();
}

export function greeting(date: Date): string {
  const hour = date.getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** "Today, 1:12 pm" · "Yesterday" · "3 Nov" */
export function formatRelativeDate(iso: string, now: Date): string {
  const date = new Date(iso);
  if (sameDay(date, now)) {
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" })
      .format(date)
      .toLowerCase();
    return `Today, ${time}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

/** "8 Nov" */
export const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));

/** "05 Nov 2026" */
export const formatTableDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  );

/** "Thursday, 5 Nov 2026 · 1:12 pm" */
export function formatFullDateTime(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(d)
    .replace(/^(\w+) /, "$1, ");
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" })
    .format(d)
    .toLowerCase();
  return `${date} · ${time}`;
}

/** "5 Nov, 2:03 pm" */
export function formatShortDateTime(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" })
    .format(d)
    .toLowerCase();
  return `${date}, ${time}`;
}

/** "Just now" · "5m ago" · "2h ago" · "Yesterday" · "4 days ago" · "2 Nov" */
export function formatTimeAgo(iso: string, nowMs: number): string {
  const diff = Math.max(0, nowMs - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatShortDate(iso);
}

/** "1 Dec 2026" from a "YYYY-MM-DD" date (read as UTC, so it never shifts a day). */
export const formatDayMonthYear = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

/** "8 Nov" from a "YYYY-MM-DD" date. */
export const formatDayMonth = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );

/** A date in the user's chosen style. Plain "YYYY-MM-DD" dates are read as UTC; instants as local. */
export function formatDatePref(value: string, style: "medium" | "dmy" | "mdy" | "ymd"): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const d = new Date(dateOnly ? `${value}T12:00:00Z` : value);
  const y = dateOnly ? d.getUTCFullYear() : d.getFullYear();
  const m = (dateOnly ? d.getUTCMonth() : d.getMonth()) + 1;
  const day = dateOnly ? d.getUTCDate() : d.getDate();
  const two = (n: number) => String(n).padStart(2, "0");
  switch (style) {
    case "dmy":
      return `${two(day)}/${two(m)}/${y}`;
    case "mdy":
      return `${two(m)}/${two(day)}/${y}`;
    case "ymd":
      return `${y}-${two(m)}-${two(day)}`;
    default:
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(dateOnly ? { timeZone: "UTC" } : {}),
      }).format(d);
  }
}
