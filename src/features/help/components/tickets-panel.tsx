"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { EASE_OUT } from "@/constants/motion";
import type { TicketStatus } from "@/constants/help";
import { usePreferences } from "@/features/settings/components/preferences-provider";
import { cn } from "@/utils/cn";
import { formatTimeAgo } from "@/utils/format";
import type { TicketSummary } from "../schemas";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
};
const STATUS_STYLE: Record<TicketStatus, string> = {
  open: "bg-brand-tint text-link",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  resolved: "bg-success-tint text-success",
};

export const TicketBadge = ({ status }: { status: TicketStatus }) => (
  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", STATUS_STYLE[status])}>
    {STATUS_LABEL[status]}
  </span>
);

/** "#1041 · Support replied 1h ago", "#1039 · Waiting for you", "#1012 · Closed 12 Oct". */
export function ticketSubtitle(
  t: TicketSummary,
  now: number,
  formatDate: (iso: string) => string,
): string {
  const ago = (iso: string) => (now ? formatTimeAgo(iso, now).toLowerCase() : "");
  const state =
    t.status === "resolved"
      ? `Closed ${formatDate(t.closedAt ?? t.updatedAt)}`
      : t.status === "pending"
        ? "Waiting for you"
        : t.lastSupportReplyAt
          ? `Support replied ${ago(t.lastSupportReplyAt)}`
          : `Opened ${ago(t.createdAt)}`;
  return `#${t.number} · ${state}`;
}

export function TicketsPanel({
  tickets,
  loading,
  now,
  onOpen,
}: {
  tickets?: TicketSummary[];
  loading: boolean;
  now: number;
  onOpen: (id: string) => void;
}) {
  const { formatDate } = usePreferences();
  return (
    <section
      aria-label="Your tickets"
      className="rounded-[24px] border border-line bg-surface p-6 sm:p-[29px]"
    >
      <h2 className="font-display text-xl font-bold text-ink">Your tickets</h2>
      {loading && !tickets ? (
        <div aria-busy="true" className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : tickets && tickets.length > 0 ? (
        <ul className="mt-2">
          {tickets.map((t, i) => (
            <motion.li
              key={t.id}
              layout="position"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT, delay: Math.min(i, 6) * 0.04 }}
              className="border-b border-line-soft last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onOpen(t.id)}
                className="flex w-full items-start justify-between gap-3 py-4 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold break-words text-ink">
                    {t.subject}
                  </span>
                  <span className="mt-1 block text-[13px] text-muted">
                    {ticketSubtitle(t, now, formatDate)}
                  </span>
                </span>
                <TicketBadge status={t.status} />
              </button>
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">
          No tickets yet. When you contact support, your conversation shows up here.
        </p>
      )}
    </section>
  );
}
