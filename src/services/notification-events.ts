/**
 * The notifications for things the user does or that happen to their account: purchases,
 * budgets and recurring payments they set up, sign-ins and password changes, imports, deletions.
 * Each one is a one-liner that says what happened. Nothing here throws.
 */
import type { BillingInterval } from "@/constants/billing";
import { ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/utils/format";
import { randomUUID } from "node:crypto";
import { purchaseReceiptEmail } from "@/lib/email/app-templates";
import { tryNotify } from "./notification-store";

const rupees = (n: number) => formatCurrency(n, "INR");
const rupeesFromPaise = (p: number) => rupees(p / 100);
const shortDate = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
const settingsSection = (s: string) => `${ROUTES.settings}?section=${s}`;

export const notifyPurchase = (
  userId: string,
  p: {
    paymentId: string;
    interval: BillingInterval;
    amountPaise: number;
    discountPaise: number;
    couponCode?: string;
    endsOn: Date;
    method: string;
  },
) =>
  tryNotify(userId, {
    kind: "purchase",
    key: `purchase:${p.paymentId}`,
    title: `Payment received · Pro (${p.interval})`,
    body: `${rupeesFromPaise(p.amountPaise)} paid with ${p.method}${
      p.couponCode ? `. Coupon ${p.couponCode} saved you ${rupeesFromPaise(p.discountPaise)}` : ""
    }. Pro is active until ${shortDate(p.endsOn)}.`,
    href: settingsSection("billing"),
    email: (user) =>
      purchaseReceiptEmail({
        name: user.name,
        planLabel: `Pro · ${p.interval === "yearly" ? "Yearly" : "Monthly"}`,
        amount: rupeesFromPaise(p.amountPaise),
        discount: p.discountPaise > 0 ? rupeesFromPaise(p.discountPaise) : undefined,
        coupon: p.couponCode,
        method: p.method,
        endsOn: shortDate(p.endsOn),
        paymentId: p.paymentId,
      }),
  });

export const notifyTransactionsDeleted = (userId: string, titles: string[]) =>
  tryNotify(userId, {
    kind: "transaction",
    key: `tx-deleted:${randomUUID()}`,
    title: titles.length === 1 ? "Transaction deleted" : `${titles.length} transactions deleted`,
    body:
      titles.length === 1
        ? `“${titles[0]}” was removed and your budgets were recalculated.`
        : `They were removed and your budgets were recalculated.`,
    href: ROUTES.transactions,
  });

export const notifyBudgetSet = (
  userId: string,
  b: { category?: string; limit: number; action: "created" | "updated" | "removed" | "overall" },
) =>
  tryNotify(userId, {
    kind: "budget-set",
    key: `budget:${b.action}:${b.category ?? "overall"}:${randomUUID()}`,
    title:
      b.action === "overall"
        ? "Overall monthly budget updated"
        : `${b.category} budget ${b.action === "created" ? "set" : b.action}`,
    body:
      b.action === "removed"
        ? `The ${b.category} limit was removed. Spending in it is still tracked.`
        : b.action === "overall"
          ? `Your total spending limit is now ${rupees(b.limit)} a month.`
          : `You can spend up to ${rupees(b.limit)} a month on ${b.category}. You'll be alerted at 80% and 100%.`,
    href: ROUTES.budgets,
  });

export const notifyBudgetsReady = (userId: string, count: number, overall: number) =>
  tryNotify(userId, {
    kind: "budget-set",
    key: `budgets-ready:${randomUUID()}`,
    title: "Your budgets are ready",
    body: `${count} category ${count === 1 ? "budget" : "budgets"} planned against ${rupees(overall)} a month.`,
    href: ROUTES.budgets,
  });

export const notifyRecurring = (
  userId: string,
  r: {
    title: string;
    action: "added" | "updated" | "paused" | "resumed" | "deleted";
    amount?: number;
    frequency?: string;
    nextDue?: string;
  },
) =>
  tryNotify(userId, {
    kind: "recurring",
    key: `recurring:${r.action}:${r.title}:${randomUUID()}`,
    title: `Recurring payment ${r.action}: ${r.title}`,
    body:
      r.action === "added" || r.action === "updated"
        ? `${r.amount !== undefined ? rupees(r.amount) : ""} ${r.frequency ?? ""}${r.nextDue ? `, next on ${shortDate(new Date(`${r.nextDue}T12:00:00Z`))}` : ""}. It's logged for you on the due date.`
        : r.action === "paused"
          ? "It won't be logged until you resume it."
          : r.action === "resumed"
            ? "It will be logged again from its next due date."
            : "No more payments will be logged. Ones already logged stay in your transactions.",
    href: ROUTES.recurringPayments,
  });

export const notifySecurity = (userId: string, title: string, body: string, key: string) =>
  tryNotify(userId, { kind: "security", key, title, body, href: settingsSection("security") });

export const notifyImport = (userId: string, imported: number, skipped: number) =>
  tryNotify(userId, {
    kind: "data",
    key: `import:${randomUUID()}`,
    title: `Imported ${imported} ${imported === 1 ? "transaction" : "transactions"}`,
    body:
      skipped > 0
        ? `${skipped} rows were skipped (bad rows or ones you already had).`
        : "Everything in the file was added.",
    href: ROUTES.transactions,
  });

export const notifySupport = (userId: string, n: { key: string; title: string; body: string }) =>
  tryNotify(userId, { kind: "support", ...n, href: ROUTES.help });
