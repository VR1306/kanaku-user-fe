/** Text cells starting with = + - @ would be run as formulas by spreadsheets; defuse them. */
export function csvCell(value: string | number | boolean): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) && typeof value === "string" ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const csvRow = (cells: (string | number | boolean)[]) => cells.map(csvCell).join(",");

/** Reverses the formula guard added by `csvCell`. */
export const uncsvCell = (value: string) => (/^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value);

/**
 * Parses CSV text into rows of cells. Handles quoted cells (with "" escapes and line breaks),
 * \r\n or \n endings and a leading byte-order mark.
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
