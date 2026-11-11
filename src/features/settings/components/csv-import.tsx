"use client";

import { useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { IMPORT_MAX_BYTES } from "@/constants/settings";
import { cn } from "@/utils/cn";
import { importTransactionsCsv } from "../api";
import type { ImportResult } from "../schemas";

type Props = {
  /** Called after a file was imported (even if some rows were skipped). */
  onImported?: () => void;
  /** Receives the outcome so the caller can show it. */
  onResult: (result: ImportResult | { error: string }) => void;
  className?: string;
};

/** "Import from CSV" button: picks a file and sends it to be imported as transactions. */
export function CsvImportButton({ onImported, onResult, className }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    if (file.size > IMPORT_MAX_BYTES) {
      onResult({ error: "That file is too large. Keep it under 1 MB." });
      return;
    }
    setBusy(true);
    try {
      const result = await importTransactionsCsv(await file.text());
      onResult(result);
      if (result.imported > 0) onImported?.();
    } catch (e) {
      onResult({ error: e instanceof Error ? e.message : "Couldn't import that file." });
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="Choose a CSV file to import"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className={cn(buttonClasses({ variant: "outline" }), "text-link", className)}
      >
        {busy ? "Importing…" : "Import from CSV"}
      </button>
    </>
  );
}

/** Plain-language summary of an import. */
export function ImportSummary({ result }: { result: ImportResult | { error: string } }) {
  if ("error" in result) {
    return (
      <p role="alert" className="rounded-control bg-danger-tint px-4 py-3 text-sm text-danger">
        {result.error}
      </p>
    );
  }
  return (
    <div role="status" className="rounded-control bg-page px-4 py-3 text-sm text-ink-2">
      <p className="font-semibold text-ink">
        Imported {result.imported} {result.imported === 1 ? "transaction" : "transactions"}
        {result.skipped > 0 ? `, skipped ${result.skipped}` : ""}.
      </p>
      {result.problems.length > 0 ? (
        <ul className="mt-1 list-disc pl-5 text-muted">
          {result.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
