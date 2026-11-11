/** Export everything a user has as CSV, and import transactions from a CSV file. */
import { FALLBACK_CATEGORY } from "@/constants/categories";
import { IMPORT_MAX_ROWS } from "@/constants/settings";
import { PAYMENT_METHODS, TITLE_MAX_LENGTH } from "@/constants/transactions";
import type { ImportResult } from "@/features/settings/schemas";
import { csvRow, parseCsv, uncsvCell } from "@/lib/csv";
import { getDb } from "@/lib/mongo";
import { categoryExists, ensureFallback } from "./categories-service";
import { importTransactions, type ImportRow } from "./transactions-extra";

const HEADER = [
  "Date",
  "Description",
  "Category",
  "Payment",
  "Type",
  "Amount",
  "Note",
  "Recurring",
];

/**
 * One CSV with the transactions first (the same columns the importer reads), then a blank line
 * and a section each for budgets, recurring payments and categories.
 */
export async function exportAllCsv(userId: string): Promise<string> {
  const db = await getDb();
  const [transactions, budgets, recurring, categories] = await Promise.all([
    db.collection("transactions").find({ userId }).sort({ date: -1 }).toArray(),
    db.collection("budgets").find({ userId }).sort({ category: 1 }).toArray(),
    db.collection("recurring").find({ userId }).sort({ nextDue: 1 }).toArray(),
    db.collection("categories").find({ userId }).sort({ order: 1 }).toArray(),
  ]);
  const lines = [
    csvRow(HEADER),
    ...transactions.map((t) =>
      csvRow([
        String(t.date).slice(0, 10),
        t.title,
        t.category,
        t.method,
        t.type,
        t.amount,
        t.note ?? "",
        t.recurring ? "yes" : "no",
      ]),
    ),
    "",
    "Budgets",
    csvRow(["Category", "Monthly limit", "Roll over"]),
    ...budgets.map((b) => csvRow([b.category, b.limit, b.rollover ? "yes" : "no"])),
    "",
    "Recurring payments",
    csvRow(["Name", "Type", "Category", "Payment", "Amount", "Repeats", "Next payment", "Active"]),
    ...recurring.map((r) =>
      csvRow([
        r.title,
        r.type,
        r.category,
        r.method,
        r.amount,
        r.frequency,
        r.nextDue,
        r.active ? "yes" : "no",
      ]),
    ),
    "",
    "Categories",
    csvRow(["Name", "Type", "Colour"]),
    ...categories.map((c) => csvRow([c.name, c.type, c.tone])),
  ];
  return lines.join("\r\n");
}

const norm = (s: string) => s.trim().toLowerCase();

/** Reads the transactions section of a CSV (header row, then rows until a blank line). */
export async function importCsv(
  userId: string,
  text: string,
  now = new Date(),
): Promise<ImportResult> {
  const all = parseCsv(text);
  const headerIndex = all.findIndex((r) => r.some((c) => c.trim() !== ""));
  if (headerIndex < 0) return { imported: 0, skipped: 0, problems: ["The file is empty."] };

  const header = all[headerIndex].map(norm);
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const idx = {
    date: col("date"),
    title: col("description", "title", "name"),
    category: col("category"),
    method: col("payment", "method", "payment mode"),
    type: col("type"),
    amount: col("amount"),
    note: col("note", "notes"),
    recurring: col("recurring"),
  };
  if (idx.date < 0 || idx.title < 0 || idx.amount < 0) {
    return {
      imported: 0,
      skipped: 0,
      problems: ["The first row must have Date, Description and Amount columns."],
    };
  }

  const today = now.toISOString().slice(0, 10);
  const rows: ImportRow[] = [];
  const problems: string[] = [];
  let skipped = 0;
  const cell = (r: string[], i: number) => (i >= 0 ? uncsvCell((r[i] ?? "").trim()) : "");
  const exists = new Map<string, boolean>();
  const fallbacks = new Map<string, string>();

  for (let n = headerIndex + 1; n < all.length; n++) {
    const r = all[n];
    if (r.every((c) => c.trim() === "")) break; // end of the transactions section
    if (rows.length + skipped >= IMPORT_MAX_ROWS) {
      problems.push(`Stopped at ${IMPORT_MAX_ROWS} rows; import the rest in another file.`);
      break;
    }
    const line = n + 1;
    const fail = (why: string) => {
      skipped++;
      if (problems.length < 5) problems.push(`Row ${line}: ${why}`);
    };

    const date = cell(r, idx.date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
      fail("the date isn't in YYYY-MM-DD format.");
      continue;
    }
    if (date > today) {
      fail("the date is in the future.");
      continue;
    }
    const title = cell(r, idx.title).slice(0, TITLE_MAX_LENGTH);
    if (!title) {
      fail("the description is empty.");
      continue;
    }
    const signed = Number(cell(r, idx.amount).replace(/[₹,\s]/g, ""));
    if (!Number.isFinite(signed) || signed === 0 || Math.abs(signed) > 1e9) {
      fail("the amount isn't a valid number.");
      continue;
    }
    const typeText = norm(cell(r, idx.type));
    const type: "expense" | "income" =
      typeText === "income" || typeText === "expense"
        ? typeText
        : signed < 0
          ? "expense"
          : "income";
    const amount = Math.round(Math.abs(signed) * 100) / 100;

    let category = cell(r, idx.category);
    const key = `${type}:${category}`;
    if (!exists.has(key))
      exists.set(key, category !== "" && (await categoryExists(userId, type, category)));
    if (!exists.get(key)) {
      if (!fallbacks.has(type)) fallbacks.set(type, await ensureFallback(userId, type));
      category = fallbacks.get(type) ?? FALLBACK_CATEGORY[type];
    }
    const methodText = cell(r, idx.method);
    const method =
      PAYMENT_METHODS.find((m) => norm(m) === norm(methodText)) ??
      (type === "income" ? "Bank transfer" : "UPI");
    const recurringText = norm(cell(r, idx.recurring));

    rows.push({
      title,
      category,
      method,
      type,
      amount,
      date,
      note: cell(r, idx.note).slice(0, 500),
      recurring: recurringText === "yes" || recurringText === "true",
    });
  }

  const imported = await importTransactions(userId, rows, now);
  const duplicates = rows.length - imported;
  if (duplicates > 0 && problems.length < 5)
    problems.push(`${duplicates} already existed and were skipped.`);
  return { imported, skipped: skipped + duplicates, problems };
}
