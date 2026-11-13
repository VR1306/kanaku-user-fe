import type { IconName } from "./icons";

export const NOTIFICATION_KINDS = [
  "budget-exceeded",
  "budget-warning",
  "bill-due",
  "bill-paid",
  "income",
  "report",
  "plan-ending",
  "purchase",
  "offer",
  "transaction",
  "budget-set",
  "recurring",
  "security",
  "data",
  "support",
  "announcement",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
] as const;
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number]["value"];

/** How each kind looks: icon and colour tone. */
export const NOTIFICATION_STYLE: Record<
  NotificationKind,
  { icon: IconName; tone: "danger" | "accent" | "violet" | "success" | "brand" }
> = {
  "budget-exceeded": { icon: "warning", tone: "danger" },
  "budget-warning": { icon: "notifications", tone: "accent" },
  "bill-due": { icon: "calendar", tone: "violet" },
  "bill-paid": { icon: "calendar", tone: "violet" },
  income: { icon: "check", tone: "success" },
  report: { icon: "reports", tone: "brand" },
  "plan-ending": { icon: "calendar", tone: "violet" },
  purchase: { icon: "check", tone: "success" },
  offer: { icon: "notifications", tone: "accent" },
  transaction: { icon: "transactions", tone: "brand" },
  "budget-set": { icon: "budgets", tone: "accent" },
  recurring: { icon: "recurring", tone: "violet" },
  security: { icon: "shield", tone: "danger" },
  data: { icon: "upload", tone: "brand" },
  support: { icon: "help", tone: "brand" },
  announcement: { icon: "notifications", tone: "accent" },
};

/** Most notifications returned in one list. */
export const NOTIFICATIONS_LIMIT = 50;
/** Remind about a recurring bill this many days before it is due. */
export const BILL_REMINDER_DAYS = 3;

/** Socket.IO events (server -> browser). */
export const SOCKET_EVENTS = {
  /** A notification was created for this user. */
  created: "notification:created",
  /** One was read, or all were. Clients refresh their counts. */
  changed: "notification:changed",
} as const;

export const REALTIME_DEFAULT_PORT = 4000;
