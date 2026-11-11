"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonClasses } from "@/components/ui/button";
import { FadeSwitch } from "@/components/motion/presence";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_REPORT_RANGE, REPORT_RANGES, type ReportRange } from "@/constants/reports";
import { transactionNewRoute } from "@/constants/routes";
import { cn } from "@/utils/cn";
import { reportCsvUrl } from "../api";
import { useReport } from "../hooks/use-report";
import { ReportChart } from "./report-chart";
import { CategoryTable, InsightCard, SummaryCards, TopMethodCard } from "./report-parts";

function LoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading report" className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[147px] rounded-[22px]" />
        ))}
      </div>
      <Skeleton className="h-[436px] rounded-[24px]" />
    </div>
  );
}

export function ReportsView() {
  const [range, setRange] = useState<ReportRange>(DEFAULT_REPORT_RANGE);
  const { data, error, loading, retry } = useReport(range);
  const empty = data ? data.series.every((p) => p.income === 0 && p.expenses === 0) : false;
  const view =
    error && !data ? "error" : !data ? "loading" : empty ? "empty" : `report-${data.range}`;

  return (
    <>
      <PageHeader
        title="Reports"
        description={data ? `Performance overview · ${data.periodLabel}` : "Performance overview"}
        actions={
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <SegmentedControl
              aria-label="Period"
              options={REPORT_RANGES}
              value={range}
              onChange={setRange}
            />
            <Button variant="outline" onClick={() => window.print()} disabled={!data || empty}>
              <span className="text-link">Export PDF</span>
            </Button>
            <a
              href={reportCsvUrl(range)}
              download
              aria-disabled={!data || empty}
              className={cn(
                buttonClasses({ variant: "outline" }),
                "text-link",
                (!data || empty) && "pointer-events-none opacity-60",
              )}
            >
              Export CSV
            </a>
          </div>
        }
      />

      <FadeSwitch id={view}>
        {error && !data ? (
          <EmptyState
            icon="help"
            title="We couldn't load your report"
            description={error}
            action={<Button onClick={retry}>Try again</Button>}
          />
        ) : !data ? (
          <LoadingState />
        ) : empty ? (
          <EmptyState
            icon="reports"
            title="No data for this period yet"
            description="Add a few transactions and your income, spending and trends will show up here."
            action={
              <Link href={transactionNewRoute} className={buttonClasses()}>
                + New transaction
              </Link>
            }
          />
        ) : (
          <div
            aria-busy={loading}
            className="flex flex-col gap-6 transition-opacity duration-200 aria-busy:opacity-70"
          >
            <Reveal y={14}>
              <SummaryCards report={data} />
            </Reveal>

            <Reveal y={14} delay={0.08}>
              <section className="rounded-[24px] border border-line bg-surface p-6 sm:p-[27px]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-[22px] font-bold text-ink">
                    Income vs expenses
                  </h2>
                  <ul className="flex items-center gap-5 text-sm text-ink-2">
                    <li className="flex items-center gap-2">
                      <span aria-hidden="true" className="h-1 w-5 rounded-full bg-accent" />
                      Income
                    </li>
                    <li className="flex items-center gap-2">
                      <span aria-hidden="true" className="h-1 w-5 rounded-full bg-brand" />
                      Expenses
                    </li>
                  </ul>
                </div>
                <div className="mt-6 overflow-x-auto">
                  <div className="min-w-[480px]">
                    <ReportChart report={data} />
                  </div>
                </div>
              </section>
            </Reveal>

            <Reveal y={14} delay={0.16}>
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_338px]">
                <CategoryTable report={data} />
                <div className="flex flex-col gap-6">
                  <InsightCard insight={data.insight} />
                  <TopMethodCard topMethod={data.topMethod} />
                </div>
              </div>
            </Reveal>
          </div>
        )}
      </FadeSwitch>
    </>
  );
}
