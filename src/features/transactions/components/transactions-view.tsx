"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Icon } from "@/components/icons/icon";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeSwitch } from "@/components/motion/presence";
import { CsvImportButton, ImportSummary } from "@/features/settings/components/csv-import";
import type { ImportResult } from "@/features/settings/schemas";
import { Skeleton } from "@/components/ui/skeleton";
import { transactionNewRoute } from "@/constants/routes";
import { TRANSACTIONS_PAGE_SIZE } from "@/constants/search";
import { cn } from "@/utils/cn";
import { deleteTransactions, exportUrl } from "../api";
import { useTransactionFilters } from "../hooks/use-transaction-filters";
import { useTransactionSearch } from "../hooks/use-transaction-search";
import { searchTerms } from "../terms";
import { TransactionsFilters } from "./transactions-filters";
import { TransactionsSummary } from "./transactions-summary";
import { TransactionsTable } from "./transactions-table";

const NOTICES: Record<string, string> = {
  deleted: "Transaction deleted. Your budgets have been recalculated.",
  saved: "Transaction saved.",
};

/** The Transactions screen: summary, filters, paged table, bulk delete and CSV export. */
export function TransactionsView() {
  const state = useTransactionFilters();
  const { filters, page, setPage } = state;
  const [notice] = useState(NOTICES[useSearchParams().get("notice") ?? ""]);

  const { data, error, loading, reload } = useTransactionSearch({
    params: { ...filters, page, pageSize: TRANSACTIONS_PAGE_SIZE },
  });

  // Selection belongs to one view of the data; changing filters or page starts afresh.
  const viewKey = JSON.stringify([filters, page]);
  const [selection, setSelection] = useState<{ key: string; ids: string[] }>({ key: "", ids: [] });
  const selected = new Set(selection.key === viewKey ? selection.ids : []);
  const select = (ids: string[]) => setSelection({ key: viewKey, ids });
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [importResult, setImportResult] = useState<ImportResult | { error: string } | null>(null);

  async function removeSelected() {
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteTransactions([...selected]);
      select([]);
      setConfirming(false);
      reload();
    } catch (e) {
      setConfirming(false);
      setDeleteError(e instanceof Error ? e.message : "Couldn't delete those transactions.");
    } finally {
      setDeleting(false);
    }
  }

  const terms = searchTerms(filters.q);
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  // A deleted last row can leave us past the final page: step back.
  if (data && page > pageCount) setPage(pageCount);

  return (
    <>
      <PageHeader
        title="Transactions"
        description="All your income and expenses in one place"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <CsvImportButton onResult={setImportResult} onImported={reload} />
            <a
              href={exportUrl(filters)}
              download
              className={buttonClasses({ variant: "outline", className: "text-link" })}
            >
              Export
            </a>
            <Link href={transactionNewRoute} className={buttonClasses()}>
              + Add transaction
            </Link>
          </div>
        }
      />

      {notice ? (
        <p
          role="status"
          className="mb-6 rounded-control bg-success-tint px-4 py-3 text-sm font-medium text-success"
        >
          {notice}
        </p>
      ) : null}
      {importResult ? (
        <div className="mb-6">
          <ImportSummary result={importResult} />
        </div>
      ) : null}
      {deleteError ? (
        <p
          role="alert"
          className="mb-6 rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
        >
          {deleteError}
        </p>
      ) : null}

      <div className="flex flex-col gap-5">
        <FadeSwitch id={data ? "summary" : "summary-loading"}>
          {data ? (
            <TransactionsSummary data={data} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[102px] rounded-[20px]" />
              ))}
            </div>
          )}
        </FadeSwitch>

        <TransactionsFilters state={state} />

        {selected.size > 0 ? (
          <div
            role="region"
            aria-label="Selected transactions"
            className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-brand-tint px-4 py-3"
          >
            <p className="text-sm font-semibold text-link">{selected.size} selected</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10" onClick={() => select([])}>
                Clear selection
              </Button>
              <Button variant="danger" className="h-10" onClick={() => setConfirming(true)}>
                <Icon name="trash" size={16} className="mr-2" />
                Delete selected
              </Button>
            </div>
          </div>
        ) : null}

        <FadeSwitch
          id={error && !data ? "error" : !data ? "loading" : data.total === 0 ? "empty" : "table"}
        >
          {error && !data ? (
            <EmptyState
              icon="help"
              title="We couldn't load transactions"
              description={error.message}
              action={<Button onClick={reload}>Try again</Button>}
            />
          ) : !data ? (
            <div aria-busy="true" aria-label="Loading transactions" className="flex flex-col gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className={cn("h-[66px] rounded-[18px]")} />
              ))}
            </div>
          ) : data.total === 0 ? (
            <EmptyState
              icon="search"
              title={state.active ? "No transactions match" : "No transactions yet"}
              description={
                state.active
                  ? "Try a different word, a category like “food”, an amount like “1250”, or clear the filters."
                  : "Add your first expense and it will show up here."
              }
              action={
                state.active ? (
                  <Button variant="outline" onClick={state.clear}>
                    Clear filters
                  </Button>
                ) : (
                  <Link href={transactionNewRoute} className={buttonClasses()}>
                    + Add transaction
                  </Link>
                )
              }
            />
          ) : (
            <TransactionsTable
              data={data}
              terms={terms}
              selected={selected}
              loading={loading}
              onPage={setPage}
              onToggle={(id) =>
                select(selected.has(id) ? [...selected].filter((x) => x !== id) : [...selected, id])
              }
              onToggleAll={(checked) => select(checked ? data.items.map((t) => t.id) : [])}
            />
          )}
        </FadeSwitch>
      </div>

      <ConfirmDialog
        open={confirming}
        tone="danger"
        icon="trash"
        title={`Delete ${selected.size} ${selected.size === 1 ? "transaction" : "transactions"}?`}
        description="They will be removed and your budgets recalculated. This can't be undone."
        confirmLabel="Delete"
        cancelLabel="Keep them"
        pending={deleting}
        onConfirm={removeSelected}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
