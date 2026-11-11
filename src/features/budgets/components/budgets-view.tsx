"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Icon } from "@/components/icons/icon";
import { FadeSwitch } from "@/components/motion/presence";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BUDGET_ALERT_PERCENTS } from "@/constants/budgets";
import { useCategories } from "@/features/categories/components/categories-provider";
import { formatMonth } from "@/utils/format";
import { updateBudgetSettings } from "../api";
import { useBudgets } from "../hooks/use-budgets";
import { BudgetCard, OverallCard } from "./budget-cards";
import { BudgetDrawer, type DrawerTarget } from "./budget-drawer";

function LoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading budgets" className="flex flex-col gap-6">
      <Skeleton className="h-[219px] rounded-[28px]" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[223px] rounded-[24px]" />
        ))}
      </div>
    </div>
  );
}

/** Budgets screen: overall budget, one card per category, alert preference, new/edit drawer. */
export function BudgetsView() {
  const { data, error, loading, reload } = useBudgets();
  const { byType } = useCategories();
  const [target, setTarget] = useState<DrawerTarget>(null);
  const [alertError, setAlertError] = useState<string>();
  const [savingAlerts, setSavingAlerts] = useState(false);

  async function toggleAlerts(next: boolean) {
    setSavingAlerts(true);
    setAlertError(undefined);
    try {
      await updateBudgetSettings({ alertsEnabled: next });
      reload();
    } catch (e) {
      setAlertError(e instanceof Error ? e.message : "Couldn't update your alert setting.");
    } finally {
      setSavingAlerts(false);
    }
  }

  const available = data ? data.items.length < byType("expense").length : true;

  return (
    <>
      <PageHeader
        title="Budgets"
        description={
          data ? `${formatMonth(data.month)} · limits by category` : "Limits by category"
        }
        actions={
          <Button onClick={() => setTarget({ kind: "new" })} disabled={!data || !available}>
            + New budget
          </Button>
        }
      />

      <FadeSwitch id={error && !data ? "error" : !data ? "loading" : "data"}>
        {error && !data ? (
          <EmptyState
            icon="help"
            title="We couldn't load your budgets"
            description={error.message}
            action={<Button onClick={reload}>Try again</Button>}
          />
        ) : !data ? (
          <LoadingState />
        ) : (
          <div
            aria-busy={loading}
            className="flex flex-col gap-6 transition-opacity duration-200 aria-busy:opacity-70"
          >
            {error ? (
              <p
                role="alert"
                className="rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
              >
                {error.message}{" "}
                <button type="button" onClick={reload} className="font-semibold underline">
                  Try again
                </button>
              </p>
            ) : null}

            <OverallCard
              data={data}
              onEdit={() => setTarget({ kind: "overall", limit: data.overall.limit })}
            />

            {data.items.length === 0 ? (
              <EmptyState
                icon="budgets"
                title="No category budgets yet"
                description="Set a limit for a category like Food or Transport and track it as you spend."
                action={<Button onClick={() => setTarget({ kind: "new" })}>+ New budget</Button>}
              />
            ) : (
              <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {data.items.map((b, i) => (
                  <li key={b.id} className="min-w-0">
                    <Reveal y={14} delay={Math.min(i, 6) * 0.05}>
                      <BudgetCard
                        budget={b}
                        currency={data.currency}
                        onEdit={() => setTarget({ kind: "edit", budget: b })}
                      />
                    </Reveal>
                  </li>
                ))}
              </ul>
            )}

            <section
              aria-label="Budget alerts"
              className="flex flex-wrap items-center gap-4 rounded-[24px] border border-line bg-surface p-6"
            >
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-[15px] bg-accent-tint text-accent-deep"
              >
                <Icon name="notifications" size={22} />
              </span>
              <div className="min-w-0 flex-1 basis-[240px]">
                <h2 className="text-[17px] font-bold text-ink">Budget alerts</h2>
                <p className="text-sm text-muted">
                  Alert me at {BUDGET_ALERT_PERCENTS.join("% and ")}% of any budget
                </p>
                <p className="text-xs text-muted">
                  Alerts always appear in Notifications. This switch controls whether they&apos;re
                  also emailed to you.
                </p>
                {alertError ? (
                  <p role="alert" className="mt-1 text-[13px] text-danger">
                    {alertError}
                  </p>
                ) : null}
              </div>
              <label className="flex cursor-pointer items-center gap-3 text-[15px] font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={data.alertsEnabled}
                  disabled={savingAlerts}
                  onChange={(e) => toggleAlerts(e.target.checked)}
                  className="size-[22px] rounded-[4px] accent-brand"
                />
                {data.alertsEnabled ? "On" : "Off"}
              </label>
            </section>
          </div>
        )}
      </FadeSwitch>

      <BudgetDrawer
        target={target}
        taken={data?.items.map((b) => b.category) ?? []}
        onClose={() => setTarget(null)}
        onChanged={reload}
      />
    </>
  );
}
