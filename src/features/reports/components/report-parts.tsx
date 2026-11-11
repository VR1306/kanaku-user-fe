import { CountUp } from "@/components/motion/presence";
import { TONE_DOT } from "@/features/dashboard/tones";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import type { ReportData } from "../schemas";

export function SummaryCards({ report }: { report: ReportData }) {
  const { summary, currency } = report;
  const money = (n: number) => formatCurrency(Math.round(n), currency);
  const saved = summary.totalSaved;
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-[22px] bg-brand p-[22px] text-on-inverse">
        <p className="text-[13px] text-accent-pale">Total spent</p>
        <p className="mt-4 font-display text-[32px] leading-tight font-bold break-words">
          <CountUp value={summary.totalSpent} format={money} />
        </p>
      </div>
      <div className="rounded-[22px] border border-line bg-surface p-[22px]">
        <p className="text-[13px] text-muted">Total saved</p>
        <p
          className={cn(
            "mt-4 font-display text-[32px] leading-tight font-bold break-words",
            saved >= 0 ? "text-success" : "text-danger",
          )}
        >
          <CountUp value={saved} format={money} />
        </p>
      </div>
      <div className="rounded-[22px] border border-line bg-surface p-[22px]">
        <p className="text-[13px] text-muted">Average per month</p>
        <p className="mt-4 font-display text-[32px] leading-tight font-bold break-words text-ink">
          <CountUp value={summary.averagePerMonth} format={money} />
        </p>
      </div>
      <div className="rounded-[22px] bg-accent p-[22px] text-on-accent">
        <p className="text-[13px] font-bold">
          {summary.peak?.unit === "day" ? "Highest day" : "Highest month"}
        </p>
        <p className="mt-4 font-display text-[32px] leading-tight font-bold">
          {summary.peak ? (
            <>
              {summary.peak.label} ·<br />
              {money(summary.peak.amount)}
            </>
          ) : (
            "—"
          )}
        </p>
      </div>
    </div>
  );
}

function ChangeBadge({ pct, hasPrevious }: { pct: number | null; hasPrevious: boolean }) {
  if (pct === null) {
    return (
      <span className="inline-flex rounded-full bg-line-soft px-3 py-1 text-[13px] font-bold text-muted">
        {hasPrevious ? "—" : "New"}
      </span>
    );
  }
  const up = pct > 0;
  const flat = pct === 0;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-[13px] font-bold whitespace-nowrap",
        flat
          ? "bg-line-soft text-muted"
          : up
            ? "bg-danger-tint text-danger"
            : "bg-success-tint text-success",
      )}
    >
      {flat ? "" : up ? "▲ " : "▼ "}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function CategoryTable({ report }: { report: ReportData }) {
  const { rows, currentLabel, previousLabel } = report.categories;
  const money = (n: number) => formatCurrency(n, report.currency);
  return (
    <section className="rounded-[24px] border border-line bg-surface p-6 sm:p-[26px]">
      <h2 className="font-display text-[22px] font-bold text-ink">
        Categories · {currentLabel} vs {previousLabel}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No spending recorded for these two months yet.</p>
      ) : (
        <table className="mt-5 w-full text-left">
          <thead>
            <tr className="text-xs font-bold tracking-[0.08em] text-muted uppercase">
              <th scope="col" className="pb-3 font-bold">
                Category
              </th>
              <th scope="col" className="pb-3 text-right font-bold">
                {previousLabel}
              </th>
              <th scope="col" className="pb-3 text-right font-bold">
                {currentLabel}
              </th>
              <th scope="col" className="pb-3 text-right font-bold">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-line-soft">
                <th scope="row" className="py-3.5 pr-2 text-[15px] font-semibold text-ink">
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cn("size-3 shrink-0 rounded-[4px]", TONE_DOT[r.tone])}
                    />
                    {r.name}
                  </span>
                </th>
                <td className="py-3.5 pl-3 text-right text-[15px] whitespace-nowrap text-muted">
                  {money(r.previous)}
                </td>
                <td className="py-3.5 pl-3 text-right font-display text-[17px] font-bold whitespace-nowrap text-ink">
                  {money(r.current)}
                </td>
                <td className="py-3.5 text-right">
                  <ChangeBadge pct={r.changePct} hasPrevious={r.previous > 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function InsightCard({ insight }: { insight: string | null }) {
  return (
    <section className="rounded-[24px] bg-brand p-[26px] text-on-inverse">
      <p className="text-xs font-bold tracking-[0.14em] text-accent-pale">INSIGHT</p>
      <p className="mt-4 font-display text-[22px] leading-[1.4]">
        {insight ?? "Keep logging transactions. Insights about your spending will appear here."}
      </p>
    </section>
  );
}

export function TopMethodCard({ topMethod }: { topMethod: ReportData["topMethod"] }) {
  return (
    <section className="rounded-[24px] border border-line bg-surface p-[27px]">
      <p className="text-xs font-bold tracking-[0.14em] text-accent-deep">TOP PAYMENT MODE</p>
      <p className="mt-4 font-display text-[30px] leading-tight font-bold text-ink">
        {topMethod ? `${topMethod.name} · ${topMethod.percent}%` : "—"}
      </p>
      <p className="mt-2 text-sm text-muted">
        {topMethod ? "of transactions this month" : "No spending recorded this month yet"}
      </p>
    </section>
  );
}
