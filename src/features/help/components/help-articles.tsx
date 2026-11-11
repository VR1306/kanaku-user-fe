"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { HELP_TOPICS } from "@/constants/help";
import { fetchArticle } from "../api";
import type { Article, ArticleSummary } from "../schemas";

const topicLabel = (value: string) => HELP_TOPICS.find((t) => t.value === value)?.label ?? value;

/** The list of matching articles. */
export function ArticleList({
  items,
  loading,
  onOpen,
}: {
  items: ArticleSummary[];
  loading: boolean;
  onOpen: (slug: string) => void;
}) {
  if (items.length === 0 && !loading) {
    return (
      <p className="rounded-2xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">
        No articles match that. Try fewer words, or send us a message below.
      </p>
    );
  }
  return (
    <ul aria-busy={loading} className="divide-y divide-line-soft">
      {items.map((a) => (
        <li key={a.slug}>
          <button
            type="button"
            onClick={() => onOpen(a.slug)}
            className="flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors hover:text-link"
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-ink">{a.title}</span>
              <span className="block text-sm text-muted">{a.summary}</span>
            </span>
            <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-bold text-link">
              {topicLabel(a.topic)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** One article, in a slide-over. */
export function ArticleDrawer({
  slug,
  onClose,
  onContact,
}: {
  slug: string | null;
  onClose: () => void;
  onContact: (topic: string) => void;
}) {
  return (
    <Drawer open={slug !== null} title="Help article" onClose={onClose}>
      {slug ? <ArticleBody slug={slug} onContact={onContact} onClose={onClose} /> : null}
    </Drawer>
  );
}

function ArticleBody({
  slug,
  onContact,
  onClose,
}: {
  slug: string;
  onContact: (topic: string) => void;
  onClose: () => void;
}) {
  const [article, setArticle] = useState<Article>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    fetchArticle(slug, controller.signal)
      .then((r) => setArticle(r.data))
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Couldn't load that article.");
      });
    return () => controller.abort();
  }, [slug]);

  if (error)
    return (
      <p role="alert" className="mt-8 text-sm text-danger">
        {error}
      </p>
    );
  if (!article) return <Skeleton aria-busy="true" className="mt-8 h-64 rounded-2xl" />;

  return (
    <div className="mt-6 flex flex-1 flex-col">
      <span className="w-fit rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-bold text-link">
        {topicLabel(article.topic)}
      </span>
      <h3 className="mt-3 font-display text-[24px] leading-tight font-bold text-ink">
        {article.title}
      </h3>
      <div className="mt-4 flex flex-col gap-3 text-[15px] leading-relaxed text-ink-2">
        {article.body.map((p, i) =>
          p.startsWith("- ") ? (
            <p key={i} className="flex gap-2 pl-1">
              <span aria-hidden="true" className="text-accent-deep">
                •
              </span>
              <span>{p.slice(2)}</span>
            </p>
          ) : (
            <p key={i}>{p}</p>
          ),
        )}
      </div>
      <div className="mt-auto rounded-2xl bg-page p-4 pt-4">
        <p className="text-sm font-semibold text-ink">Still stuck?</p>
        <button
          type="button"
          onClick={() => {
            onContact(article.topic);
            onClose();
          }}
          className="mt-1 text-sm font-semibold text-link hover:underline"
        >
          Send a message to support
        </button>
      </div>
    </div>
  );
}
