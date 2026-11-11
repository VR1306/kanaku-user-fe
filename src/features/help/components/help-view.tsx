"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { PageHeader } from "@/components/layout/page-header";
import { FadeSwitch } from "@/components/motion/presence";
import { HELP_TOPICS, SUPPORT_REPLY_HOURS, type HelpTopic } from "@/constants/help";
import { FOCUS_FIELD } from "@/constants/styles";
import { ROUTES } from "@/constants/routes";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/utils/cn";
import { useArticles, useTickets } from "../hooks/use-help";
import { ContactForm } from "./contact-form";
import { ArticleDrawer, ArticleList } from "./help-articles";
import { TicketDrawer } from "./ticket-drawer";
import { TicketsPanel } from "./tickets-panel";

const subscribe = (notify: () => void) => {
  const id = setInterval(notify, 60_000);
  return () => clearInterval(id);
};
const minute = () => Math.floor(Date.now() / 60_000) * 60_000;

/** Help & support: search the help centre, contact the team, and follow your tickets. */
export function HelpView() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<HelpTopic>();
  const [article, setArticle] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [contact, setContact] = useState({ topic: "getting-started", nonce: 0 });
  const search = useDebouncedValue(query.trim(), 250);
  const { items, loading, active } = useArticles(search, topic);
  const { tickets, loading: ticketsLoading, reload } = useTickets();
  const now = useSyncExternalStore(subscribe, minute, () => 0);
  const topicLabel = HELP_TOPICS.find((t) => t.value === topic)?.label;

  function contactAbout(next: string) {
    setContact((c) => ({ topic: next, nonce: c.nonce + 1 }));
    document
      .getElementById("contact-support")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-muted">
        <Link href={ROUTES.settings} className="text-link hover:underline">
          Settings
        </Link>{" "}
        › Help
      </nav>
      <PageHeader
        title="Help & support"
        description={`Find an answer or talk to our team · we reply within ${SUPPORT_REPLY_HOURS} hours`}
        actions={
          <div className="relative w-full sm:w-[334px]">
            <label htmlFor="help-search" className="sr-only">
              Search help articles
            </label>
            <Icon
              name="search"
              size={18}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-subtle"
            />
            <input
              id="help-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles"
              autoComplete="off"
              className={cn(
                "h-[54px] w-full rounded-control border border-line-strong bg-surface pr-4 pl-11 text-[15px] text-ink placeholder:text-subtle",
                FOCUS_FIELD,
              )}
            />
          </div>
        }
      />

      <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-[repeat(2,minmax(0,1fr))] xl:grid-cols-4">
        {HELP_TOPICS.map((t) => {
          const selected = topic === t.value;
          return (
            <li key={t.value}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setTopic(selected ? undefined : t.value)}
                className={cn(
                  "flex h-full w-full flex-col rounded-[24px] border bg-surface p-[23px] text-left transition-colors duration-200 hover:border-brand",
                  selected ? "border-brand ring-2 ring-brand/20" : "border-line",
                )}
              >
                <span className="grid size-11 place-items-center rounded-[12px] bg-brand-tint text-link">
                  <Icon name={t.icon} size={22} strokeWidth={1.9} />
                </span>
                <span className="mt-5 text-base font-bold text-ink">{t.label}</span>
                <span className="mt-1 text-sm text-muted">{t.description}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <FadeSwitch id={active ? "results" : "none"}>
        {active ? (
          <section
            aria-label="Help articles"
            className="mt-6 rounded-[24px] border border-line bg-surface p-6 sm:p-[29px]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-ink">
                {search ? `Results for “${search}”` : topicLabel}
                {search && topicLabel ? <span className="text-muted"> in {topicLabel}</span> : null}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setTopic(undefined);
                }}
                className="text-sm font-semibold text-link hover:underline"
              >
                Clear
              </button>
            </div>
            <div className="mt-2">
              <ArticleList items={items} loading={loading} onOpen={setArticle} />
            </div>
          </section>
        ) : (
          <span />
        )}
      </FadeSwitch>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,614px)_minmax(0,300px)]">
        <div id="contact-support">
          <ContactForm key={contact.nonce} topic={contact.topic} onCreated={reload} />
        </div>
        <TicketsPanel tickets={tickets} loading={ticketsLoading} now={now} onOpen={setTicketId} />
      </div>

      <ArticleDrawer slug={article} onClose={() => setArticle(null)} onContact={contactAbout} />
      <TicketDrawer id={ticketId} onClose={() => setTicketId(null)} onChanged={reload} />
    </>
  );
}
