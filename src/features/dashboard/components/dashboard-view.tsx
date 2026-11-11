"use client";

import { FadeSwitch } from "@/components/motion/presence";
import { Reveal } from "@/components/motion/reveal";
import { useNotificationsContext } from "@/features/notifications/components/notifications-provider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DASHBOARD_MONTHS_BACK } from "@/constants/dashboard";
import { ROUTES } from "@/constants/routes";
import { useMountTime } from "@/hooks/use-mount-time";
import { cn } from "@/utils/cn";
import { formatMonth, recentMonths, toMonthKey } from "@/utils/format";
import { useDashboard } from "../hooks/use-dashboard";
import { RecentTransactionsCard, BudgetsCard, UpcomingBillsCard } from "./activity-cards";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { MonthlySpendingCard, SpendingBreakdownCard } from "./spending-cards";
import { BudgetRemainingCard, SpendHeroCard } from "./summary-cards";

export function DashboardView({ firstName }: { firstName: string }) {
  const mountTime = useMountTime();
  const now = mountTime ? new Date(mountTime) : null;
  const [selected, setSelected] = useState<string | null>(null);
  const month = selected ?? (now ? toMonthKey(now) : null);
  const months = now
    ? recentMonths(now, DASHBOARD_MONTHS_BACK).map((k) => ({ value: k, label: formatMonth(k) }))
    : [];

  const { unread } = useNotificationsContext();
  const { data, error, loading, retry } = useDashboard(month);
  const router = useRouter();
  const sessionEnded = error?.status === 401;
  useEffect(() => {
    if (sessionEnded) router.replace(ROUTES.login);
  }, [sessionEnded, router]);

  return (
    <>
      <DashboardHeader
        firstName={firstName}
        now={now}
        month={month}
        months={months}
        onMonthChange={setSelected}
        unreadNotifications={unread}
      />

      <FadeSwitch id={error && !data ? "error" : !data || !now ? "loading" : `month-${data.month}`}>
        {error && !data ? (
          <EmptyState
            icon="help"
            title="We couldn't load your dashboard"
            description={error.message}
            action={<Button onClick={retry}>Try again</Button>}
          />
        ) : !data || !now ? (
          <DashboardSkeleton />
        ) : (
          <div
            aria-busy={loading}
            className={cn(
              "flex flex-col gap-6 transition-opacity duration-200",
              loading && "pointer-events-none opacity-60",
            )}
          >
            {error ? (
              <p
                role="alert"
                className="rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
              >
                {error.message}{" "}
                <button type="button" onClick={retry} className="font-semibold underline">
                  Try again
                </button>
              </p>
            ) : null}
            <Reveal y={14}>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[542fr_373fr]">
                <SpendHeroCard data={data} />
                <BudgetRemainingCard data={data} />
              </div>
            </Reveal>
            <Reveal y={14} delay={0.08}>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[532fr_383fr]">
                <MonthlySpendingCard data={data} />
                <SpendingBreakdownCard data={data} />
              </div>
            </Reveal>
            <Reveal y={14} delay={0.16}>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[568fr_347fr]">
                <RecentTransactionsCard data={data} now={now} />
                <div className="flex flex-col gap-6">
                  <BudgetsCard data={data} />
                  <UpcomingBillsCard data={data} />
                </div>
              </div>
            </Reveal>
          </div>
        )}
      </FadeSwitch>
    </>
  );
}
