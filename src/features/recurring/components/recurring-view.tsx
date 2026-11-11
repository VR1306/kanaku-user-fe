"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CountUp, FadeSwitch } from "@/components/motion/presence";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMountTime } from "@/hooks/use-mount-time";
import { formatCurrency, formatDayMonth } from "@/utils/format";
import { useRecurring } from "../hooks/use-recurring";
import type { RecurringList } from "../schemas";
import { RecurringDrawer, type RecurringTarget } from "./recurring-drawer";
import { RecurringRow } from "./recurring-row";

function LoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading recurring payments" className="flex flex-col gap-6">
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[146px] rounded-[22px]" />
        ))}
      </div>
      <div className="overflow-hidden rounded-[24px] border border-line bg-surface">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[81px] rounded-none" />
        ))}
      </div>
    </div>
  );
}

function Summary({ data }: { data: RecurringList }) {
  const money = (n: number) => formatCurrency(Math.round(n), data.currency);
  const { summary } = data;
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <div className="rounded-[22px] bg-brand p-6 text-on-inverse">
        <p className="text-[13px] tracking-[0.12em] text-accent-pale uppercase">
          Committed each month
        </p>
        <p className="mt-5 font-display text-4xl leading-tight font-bold break-words">
          <CountUp value={summary.committed} format={money} />
        </p>
      </div>
      <div className="rounded-[22px] border border-line bg-surface p-6">
        <p className="text-[13px] text-muted">Recurring income</p>
        <p className="mt-5 font-display text-4xl leading-tight font-bold break-words text-success">
          <CountUp value={summary.income} format={money} />
        </p>
      </div>
      <div className="rounded-[22px] bg-accent p-6 text-on-accent">
        <p className="text-[13px] font-bold tracking-[0.12em] uppercase">Next due</p>
        <p className="mt-5 font-display text-[30px] leading-tight font-bold">
          {summary.next
            ? `${summary.next.title} · ${formatDayMonth(summary.next.date)}`
            : "Nothing due"}
        </p>
      </div>
    </div>
  );
}

export function RecurringView() {
  const { data, error, loading, reload, toggle, toggleError } = useRecurring();
  const [target, setTarget] = useState<RecurringTarget>(null);
  const mountTime = useMountTime();
  const today = new Date(mountTime || 0).toISOString().slice(0, 10);

  const view = error && !data ? "error" : !data ? "loading" : data.items.length ? "list" : "empty";

  return (
    <>
      <PageHeader
        title="Recurring payments"
        description="Rent, bills and salary — logged for you, on schedule"
        actions={
          <Button onClick={() => setTarget("new")} disabled={!mountTime}>
            + Add recurring
          </Button>
        }
      />

      <FadeSwitch id={view}>
        {error && !data ? (
          <EmptyState
            icon="help"
            title="We couldn't load your recurring payments"
            description={error}
            action={<Button onClick={reload}>Try again</Button>}
          />
        ) : !data ? (
          <LoadingState />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon="recurring"
            title="No recurring payments yet"
            description="Add rent, bills or your salary once and Kanaku logs them on the due date."
            action={<Button onClick={() => setTarget("new")}>+ Add recurring</Button>}
          />
        ) : (
          <div
            aria-busy={loading}
            className="flex flex-col gap-6 transition-opacity duration-200 aria-busy:opacity-70"
          >
            {toggleError ? (
              <p
                role="alert"
                className="rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
              >
                {toggleError}
              </p>
            ) : null}
            <Reveal y={14}>
              <Summary data={data} />
            </Reveal>
            <section
              aria-label="Recurring payments"
              className="overflow-hidden rounded-[24px] border border-line bg-surface"
            >
              <ul>
                {data.items.map((item, i) => (
                  <RecurringRow
                    key={item.id}
                    item={item}
                    index={i}
                    currency={data.currency}
                    onEdit={() => setTarget(item)}
                    onToggle={(active) => void toggle(item.id, active)}
                  />
                ))}
              </ul>
            </section>
          </div>
        )}
      </FadeSwitch>

      <RecurringDrawer
        target={target}
        today={today}
        onClose={() => setTarget(null)}
        onChanged={reload}
      />
    </>
  );
}
