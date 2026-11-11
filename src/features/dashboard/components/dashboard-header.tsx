"use client";

import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { ROUTES } from "@/constants/routes";
import { Select, type SelectOption } from "@/components/ui/select";
import { TransactionSearchBox } from "@/features/transactions/components/transaction-search-box";
import { formatLongDate, greeting } from "@/utils/format";

type DashboardHeaderProps = {
  firstName: string;
  /** null until the browser knows the time (avoids a server/client mismatch). */
  now: Date | null;
  month: string | null;
  months: SelectOption[];
  onMonthChange: (month: string) => void;
  unreadNotifications: number;
};

export function DashboardHeader({
  firstName,
  now,
  month,
  months,
  onMonthChange,
  unreadNotifications,
}: DashboardHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
      <div>
        <p className="flex min-h-5 items-center gap-3 text-[13px] font-bold tracking-[0.14em] text-accent-deep">
          {now ? formatLongDate(now) : " "}
        </p>
        <h1 className="mt-2 font-display text-[32px] leading-tight font-bold text-ink sm:text-[40px]">
          {now ? `${greeting(now)}, ${firstName}` : `Welcome, ${firstName}`}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TransactionSearchBox className="w-full sm:w-60" />
        <Link
          href={ROUTES.notifications}
          aria-label={
            unreadNotifications > 0
              ? `Notifications, ${unreadNotifications} unread`
              : "Notifications"
          }
          className="relative grid size-[50px] place-items-center rounded-control border border-line bg-surface text-link"
        >
          <Icon name="notifications" size={20} />
          {unreadNotifications > 0 ? (
            <span className="absolute top-[11px] right-[12px] size-[9px] rounded-full bg-danger" />
          ) : null}
        </Link>
        <Select
          aria-label="Month"
          compact
          className="w-[196px]"
          value={month ?? ""}
          onChange={(e) => onMonthChange(e.target.value)}
          options={months.length ? months : [{ value: "", label: "Loading…" }]}
          disabled={!months.length}
        />
      </div>
    </header>
  );
}
