"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES, transactionEditRoute } from "@/constants/routes";
import { TONE_TINT } from "@/features/dashboard/tones";
import { cn } from "@/utils/cn";
import { formatCurrency, formatFullDateTime, formatShortDateTime } from "@/utils/format";
import { deleteTransaction } from "../api";
import { useImpact } from "../hooks/use-impact";
import { useTransaction } from "../hooks/use-transaction";
import type { TransactionDetail } from "../schemas";
import { ImpactCard } from "./impact-card";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line-soft py-5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-ink">{children}</dd>
    </div>
  );
}

function Details({ t }: { t: TransactionDetail }) {
  return (
    <section
      aria-label="Details"
      className="rounded-[24px] border border-line bg-surface px-7 pt-1 pb-7"
    >
      <dl className="grid gap-x-8 sm:grid-cols-2">
        <Fact label="Type">{t.type === "income" ? "Income" : "Expense"}</Fact>
        <Fact label="Category">
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-sm font-semibold",
              TONE_TINT[t.tone],
            )}
          >
            {t.category}
          </span>
        </Fact>
        <Fact label={t.type === "income" ? "Received by" : "Paid with"}>{t.method}</Fact>
        <Fact label="Repeats">{t.recurring ? "Every month" : "No"}</Fact>
      </dl>
      <div className="pt-5">
        <p className="text-[13px] text-muted">Note</p>
        <p className={cn("mt-1 text-base break-words", t.note ? "text-ink" : "text-subtle")}>
          {t.note || "No note added."}
        </p>
      </div>
    </section>
  );
}

function History({ t }: { t: TransactionDetail }) {
  return (
    <section aria-label="History" className="rounded-[24px] border border-line bg-surface p-7">
      <h2 className="font-display text-xl font-bold text-ink">History</h2>
      <ol className="mt-4 flex flex-col gap-3">
        {t.history.map((h, i) => (
          <li key={h.id} className="flex items-baseline gap-3 text-sm text-ink">
            <span
              aria-hidden="true"
              className={cn(
                "mt-1.5 size-2.5 shrink-0 translate-y-px rounded-full",
                i === t.history.length - 1 ? "bg-brand" : "bg-accent",
              )}
            />
            <span>
              <strong className="font-bold">{h.label}</strong>
              {h.detail ? ` ${h.detail}` : ""} · {formatShortDateTime(h.at)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Receipt() {
  return (
    <section aria-label="Receipt" className="rounded-[24px] border border-line bg-surface p-6">
      <h2 className="font-display text-xl font-bold text-ink">Receipt</h2>
      <div className="mt-4 grid h-[200px] place-items-center rounded-2xl border border-dashed border-line-strong bg-page px-4 text-center text-sm text-muted">
        No receipt attached
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-11 text-link"
          disabled
          title="Receipts aren't available yet."
        >
          Download
        </Button>
        <Button
          variant="outline"
          className="h-11 text-link"
          disabled
          title="Receipts aren't available yet."
        >
          Replace
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted">Receipt storage isn&apos;t connected yet.</p>
    </section>
  );
}

function LoadingState() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading transaction"
      className="grid gap-6 lg:grid-cols-[1fr_352px]"
    >
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[131px] rounded-[28px]" />
        <Skeleton className="h-[254px] rounded-[24px]" />
      </div>
      <Skeleton className="h-[389px] rounded-[24px]" />
    </div>
  );
}

export function TransactionDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: t, error, loading, reload } = useTransaction(id);
  const { impact, failed } = useImpact(
    t ? { type: t.type, category: t.category, amount: Math.abs(t.amount), excludeId: t.id } : null,
  );
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  async function remove() {
    setDeleting(true);
    try {
      await deleteTransaction(id);
      router.replace(`${ROUTES.transactions}?notice=deleted`);
    } catch (e) {
      setDeleting(false);
      setConfirming(false);
      setDeleteError(e instanceof Error ? e.message : "Couldn't delete this transaction.");
    }
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <Link href={ROUTES.transactions} className="font-semibold text-link underline">
          Transactions
        </Link>
        {t ? <span className="text-muted"> / {t.title}</span> : null}
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[32px] leading-tight font-bold text-ink sm:text-[40px]">
          Transaction details
        </h1>
        {t ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={cn(
                "inline-flex h-12 items-center rounded-control border border-danger/40 bg-surface px-6 text-[15px] font-semibold text-danger transition-colors hover:bg-danger-tint",
              )}
            >
              Delete
            </button>
            <Link
              href={transactionEditRoute(t.id)}
              className={buttonClasses({ className: "h-12" })}
            >
              Edit transaction
            </Link>
          </div>
        ) : null}
      </header>

      {deleteError ? (
        <p
          role="alert"
          className="mb-6 rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
        >
          {deleteError}
        </p>
      ) : null}

      {error && !t ? (
        <EmptyState
          icon="help"
          title={
            error.status === 404 ? "Transaction not found" : "We couldn't load this transaction"
          }
          description={error.status === 404 ? "It may have been deleted." : error.message}
          action={
            error.status === 404 ? (
              <Link href={ROUTES.transactions} className={buttonClasses()}>
                Back to transactions
              </Link>
            ) : (
              <Button onClick={reload}>Try again</Button>
            )
          }
        />
      ) : loading || !t ? (
        <LoadingState />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_352px]">
          <div className="flex flex-col gap-6">
            <section
              aria-label="Summary"
              className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-[28px] bg-brand p-8"
            >
              <span
                aria-hidden="true"
                className="grid size-16 shrink-0 place-items-center rounded-[20px] bg-accent font-display text-[28px] font-bold text-on-accent"
              >
                {t.title.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 basis-[140px]">
                <p className="truncate text-[22px] font-bold text-on-primary">{t.title}</p>
                <p className="mt-1 text-sm text-brand-pale">{formatFullDateTime(t.date)}</p>
              </div>
              <p className="font-display text-[44px] leading-none font-bold text-on-primary sm:text-[52px]">
                {t.amount < 0 ? "−" : "+"}
                {formatCurrency(Math.abs(t.amount), t.currency)}
              </p>
            </section>
            <Details t={t} />
            <History t={t} />
          </div>
          <div className="flex flex-col gap-6">
            <Receipt />
            <ImpactCard impact={impact} unavailable={failed} heading="Budget" />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        tone="danger"
        icon="trash"
        title="Delete this transaction?"
        description={
          t
            ? `“${t.title}” for ${formatCurrency(Math.abs(t.amount), t.currency)} will be removed and your budgets recalculated. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Keep it"
        pending={deleting}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
