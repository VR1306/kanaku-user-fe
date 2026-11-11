import { formatCurrency } from "@/utils/format";
import type { TransactionsPage } from "../schemas";

/** Money out / money in / net for everything the current filters match. */
export function TransactionsSummary({ data }: { data: TransactionsPage }) {
  const { moneyOut, moneyIn, net } = data.summary;
  const money = (n: number) => formatCurrency(n, data.currency);
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-[20px] border border-line bg-surface p-[23px]">
        <dt className="text-[13px] text-muted">Money out</dt>
        <dd className="mt-2 font-display text-[30px] leading-tight font-bold text-danger">
          −{money(moneyOut)}
        </dd>
      </div>
      <div className="rounded-[20px] border border-line bg-surface p-[23px]">
        <dt className="text-[13px] text-muted">Money in</dt>
        <dd className="mt-2 font-display text-[30px] leading-tight font-bold text-success">
          +{money(moneyIn)}
        </dd>
      </div>
      <div className="rounded-[20px] bg-brand p-[22px]">
        <dt className="text-[13px] text-brand-pale">Net this period</dt>
        <dd className="mt-2 font-display text-[30px] leading-tight font-bold text-accent">
          {net < 0 ? "−" : "+"}
          {money(Math.abs(net))}
        </dd>
      </div>
    </dl>
  );
}
