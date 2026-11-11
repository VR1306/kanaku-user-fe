"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { FadeSwitch } from "@/components/motion/presence";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { EASE_OUT } from "@/constants/motion";
import { NOTIFICATION_FILTERS, type NotificationFilter } from "@/constants/notifications";
import { cn } from "@/utils/cn";
import { formatTimeAgo } from "@/utils/format";
import { useNotifications } from "../hooks/use-notifications";
import type { AppNotification } from "../schemas";
import { NotificationIcon } from "./notification-icon";

/** Current time, refreshed every minute so "5m ago" stays honest. 0 until the browser is ready. */
const subscribe = (notify: () => void) => {
  const id = setInterval(notify, 60_000);
  return () => clearInterval(id);
};
const minute = () => Math.floor(Date.now() / 60_000) * 60_000;

function Row({
  item,
  index,
  now,
  onOpen,
}: {
  item: AppNotification;
  index: number;
  now: number;
  onOpen: (n: AppNotification) => void;
}) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT, delay: Math.min(index, 8) * 0.04 }}
      className="border-b border-line-soft last:border-b-0"
    >
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={cn(
          "flex w-full items-start gap-4 px-5 py-5 text-left transition-colors duration-300 sm:px-6",
          item.read ? "bg-surface hover:bg-page" : "bg-accent-tint/60 hover:bg-accent-tint",
        )}
      >
        <NotificationIcon kind={item.kind} />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-ink">{item.title}</span>
          <span className="mt-1 block text-sm text-muted">{item.body}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-3 pt-0.5">
          <span className="text-[13px] whitespace-nowrap text-muted">
            {now ? formatTimeAgo(item.createdAt, now) : ""}
          </span>
          <span
            aria-label={item.read ? undefined : "Unread"}
            className={cn(
              "size-2.5 rounded-full bg-accent transition-opacity duration-300",
              item.read && "opacity-0",
            )}
          />
        </span>
      </button>
    </motion.li>
  );
}

export function NotificationsView() {
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const { data, dataFilter, error, loading, retry, read, readAll } = useNotifications(filter);
  const now = useSyncExternalStore(subscribe, minute, () => 0);
  const unread = data?.unreadCount ?? 0;

  function open(item: AppNotification) {
    if (!item.read) void read(item.id);
    if (item.href) router.push(item.href);
  }

  // The tab pill moves at once; the list swaps when the new tab's data has arrived.
  const shown = dataFilter ?? filter;
  const view =
    error && !data
      ? "error"
      : !data
        ? "loading"
        : `${shown}-${data.items.length ? "list" : "empty"}`;

  return (
    <>
      <PageHeader
        title="Notifications"
        description={data ? `Alerts and updates · ${unread} unread` : "Alerts and updates"}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              aria-label="Show notifications"
              options={NOTIFICATION_FILTERS}
              value={filter}
              onChange={setFilter}
            />
            <Button
              variant="outline"
              onClick={() => void readAll()}
              disabled={!data || unread === 0}
            >
              <span className="text-link">Mark all as read</span>
            </Button>
          </div>
        }
      />

      <FadeSwitch id={view}>
        {error && !data ? (
          <EmptyState
            icon="help"
            title="We couldn't load your notifications"
            description={error}
            action={<Button onClick={retry}>Try again</Button>}
          />
        ) : !data ? (
          <div
            aria-busy="true"
            aria-label="Loading notifications"
            className="flex flex-col gap-px overflow-hidden rounded-card border border-line bg-surface"
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[87px] rounded-none" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <section
            aria-live="polite"
            className="rounded-card border border-line bg-surface px-6 py-14 text-center"
          >
            <h2 className="font-display text-[26px] font-bold text-ink">
              {shown === "unread" ? "No new notifications" : "No notifications yet"}
            </h2>
            <p className="mt-2 text-base text-muted">
              {shown === "unread"
                ? "You're all caught up."
                : "Budget alerts, bill reminders and monthly reports will show up here."}
            </p>
          </section>
        ) : (
          <section
            aria-label="Notifications"
            aria-busy={loading}
            className="overflow-hidden rounded-card border border-line bg-surface"
          >
            <ul>
              {data.items.map((item, i) => (
                <Row key={item.id} item={item} index={i} now={now} onOpen={open} />
              ))}
            </ul>
          </section>
        )}
      </FadeSwitch>
    </>
  );
}
