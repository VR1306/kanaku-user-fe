/**
 * Builds the "Export all data" Excel workbook: one sheet per part of the app (profile,
 * transactions, budgets, recurring payments, categories, notifications) plus a monthly summary.
 * Numbers and dates are real spreadsheet values, not text, so they can be sorted and summed.
 */
import ExcelJS from "exceljs";
import { describeSchedule, type Frequency } from "@/constants/recurring";
import { getDb } from "@/lib/mongo";
import { listCategories } from "./categories-service";
import { getPreferences } from "./settings-service";
import { bucketTotals } from "./transactions-extra";
import { monthTotals } from "./transactions-service";

const MONEY = '"₹"#,##0.00;[Red]-"₹"#,##0.00';
const DATE = "dd mmm yyyy";
const DATETIME = "dd mmm yyyy hh:mm";
const BRAND = "FF1D4ED8";
const MONTHS_IN_SUMMARY = 12;

type Column = { header: string; key: string; width: number; format?: string };

/** Adds a sheet with a styled, frozen header row, filters and column formats. */
function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: Column[],
  rows: Record<string, unknown>[],
) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  ws.addRows(rows);
  const header = ws.getRow(1);
  header.height = 24;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.alignment = { vertical: "middle" };
  });
  columns.forEach((c, i) => {
    if (c.format) ws.getColumn(i + 1).numFmt = c.format;
  });
  if (rows.length > 0) {
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  }
  return ws;
}

const yesNo = (v: unknown) => (v ? "Yes" : "No");
const day = (iso: string) => new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);

export async function buildWorkbook(userId: string, now = new Date()): Promise<Buffer> {
  const db = await getDb();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_IN_SUMMARY - 1), 1);
  const monthEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);

  const [
    user,
    profile,
    prefs,
    transactions,
    budgets,
    recurring,
    categories,
    notifications,
    months,
    spent,
  ] = await Promise.all([
    db.collection("users").findOne({ _id: userId as never }),
    db.collection("profiles").findOne({ _id: userId as never }),
    getPreferences(userId),
    db.collection("transactions").find({ userId }).sort({ date: -1 }).toArray(),
    db.collection("budgets").find({ userId }).sort({ category: 1 }).toArray(),
    db.collection("recurring").find({ userId }).sort({ nextDue: 1 }).toArray(),
    listCategories(userId, now),
    db.collection("notifications").find({ userId }).sort({ createdAt: -1 }).toArray(),
    bucketTotals(userId, monthStart, monthEnd, "month"),
    monthTotals(userId, now, 0),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Kanaku";
  wb.created = now;

  addSheet(
    wb,
    "Profile",
    [
      { header: "Field", key: "field", width: 26 },
      { header: "Value", key: "value", width: 40 },
    ],
    [
      { field: "Name", value: user?.name ?? "" },
      { field: "Email", value: user?.email ?? "" },
      { field: "Phone", value: profile?.phone ?? "" },
      { field: "Monthly income (₹)", value: profile?.monthlyIncome ?? "" },
      { field: "Overall monthly budget (₹)", value: profile?.overallBudget ?? "" },
      { field: "Currency", value: prefs.currency },
      { field: "Budget alert emails", value: yesNo(prefs.emailBudgetAlerts) },
      { field: "Bill reminder emails", value: yesNo(prefs.emailBillReminders) },
      { field: "Monthly report emails", value: yesNo(prefs.emailMonthlyReport) },
      { field: "Announcement emails", value: yesNo(prefs.emailAnnouncements) },
      { field: "Announcement SMS", value: yesNo(prefs.smsAnnouncements) },
      { field: "Exported on", value: now.toISOString().slice(0, 10) },
    ],
  );

  addSheet(
    wb,
    "Transactions",
    [
      { header: "Date", key: "date", width: 14, format: DATE },
      { header: "Description", key: "title", width: 30 },
      { header: "Category", key: "category", width: 20 },
      { header: "Payment", key: "method", width: 16 },
      { header: "Type", key: "type", width: 10 },
      { header: "Amount", key: "amount", width: 16, format: MONEY },
      { header: "Note", key: "note", width: 30 },
      { header: "Recurring", key: "recurring", width: 11 },
    ],
    transactions.map((t) => ({
      date: day(t.date),
      title: t.title,
      category: t.category,
      method: t.method,
      type: t.type === "income" ? "Income" : "Expense",
      amount: t.amount,
      note: t.note ?? "",
      recurring: yesNo(t.recurring),
    })),
  );

  addSheet(
    wb,
    "Budgets",
    [
      { header: "Category", key: "category", width: 22 },
      { header: "Monthly limit", key: "limit", width: 16, format: MONEY },
      { header: "Spent this month", key: "spent", width: 18, format: MONEY },
      { header: "Left this month", key: "left", width: 18, format: MONEY },
      { header: "Rolls over", key: "rollover", width: 12 },
    ],
    budgets.map((b) => {
      const used = spent.byCategory[b.category] ?? 0;
      return {
        category: b.category,
        limit: b.limit,
        spent: used,
        left: Math.round((b.limit - used) * 100) / 100,
        rollover: yesNo(b.rollover),
      };
    }),
  );

  addSheet(
    wb,
    "Recurring payments",
    [
      { header: "Name", key: "title", width: 28 },
      { header: "Type", key: "type", width: 10 },
      { header: "Category", key: "category", width: 20 },
      { header: "Payment", key: "method", width: 16 },
      { header: "Amount", key: "amount", width: 16, format: MONEY },
      { header: "Repeats", key: "repeats", width: 20 },
      { header: "Next payment", key: "next", width: 14, format: DATE },
      { header: "Status", key: "status", width: 10 },
    ],
    recurring.map((r) => ({
      title: r.title,
      type: r.type === "income" ? "Income" : "Expense",
      category: r.category,
      method: r.method,
      amount: r.type === "income" ? r.amount : -r.amount,
      repeats: describeSchedule(r.frequency as Frequency, r.anchorDay, r.nextDue),
      next: r.active ? day(r.nextDue) : "",
      status: r.active ? "Active" : "Paused",
    })),
  );

  addSheet(
    wb,
    "Categories",
    [
      { header: "Name", key: "name", width: 24 },
      { header: "Type", key: "type", width: 10 },
      { header: "Colour", key: "tone", width: 12 },
      { header: "Monthly budget", key: "budget", width: 16, format: MONEY },
      { header: "Transactions this month", key: "count", width: 24 },
      { header: "Total this month", key: "total", width: 18, format: MONEY },
    ],
    categories.map((c) => ({
      name: c.name,
      type: c.type === "income" ? "Income" : "Expense",
      tone: c.tone,
      budget: c.budget ?? "",
      count: c.monthCount,
      total: c.monthTotal,
    })),
  );

  addSheet(
    wb,
    "Monthly summary",
    [
      { header: "Month", key: "month", width: 14 },
      { header: "Income", key: "income", width: 16, format: MONEY },
      { header: "Expenses", key: "expenses", width: 16, format: MONEY },
      { header: "Saved", key: "saved", width: 16, format: MONEY },
    ],
    Array.from({ length: MONTHS_IN_SUMMARY }, (_, i) => {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_IN_SUMMARY - 1) + i, 1),
      );
      const m = months[d.toISOString().slice(0, 7)] ?? { income: 0, expenses: 0 };
      return {
        month: new Intl.DateTimeFormat("en-GB", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(d),
        income: m.income,
        expenses: m.expenses,
        saved: Math.round((m.income - m.expenses) * 100) / 100,
      };
    }).reverse(),
  );

  addSheet(
    wb,
    "Notifications",
    [
      { header: "Date", key: "date", width: 20, format: DATETIME },
      { header: "Type", key: "kind", width: 18 },
      { header: "Title", key: "title", width: 34 },
      { header: "Message", key: "body", width: 60 },
      { header: "Read", key: "read", width: 8 },
    ],
    notifications.map((n) => ({
      date: new Date(n.createdAt),
      kind: String(n.kind).replace(/-/g, " "),
      title: n.title,
      body: n.body,
      read: yesNo(n.read),
    })),
  );

  return Buffer.from(await wb.xlsx.writeBuffer());
}
