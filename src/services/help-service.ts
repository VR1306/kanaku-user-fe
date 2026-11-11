import { HELP_ARTICLES, type HelpArticle } from "@/constants/help-articles";
import type { HelpTopic } from "@/constants/help";

const summary = ({ slug, topic, title, summary }: HelpArticle) => ({ slug, topic, title, summary });

/** Searches the articles: every word you type must appear in the title, summary or text. */
export function searchArticles(query?: string, topic?: HelpTopic) {
  const words = (query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  return HELP_ARTICLES.filter((a) => {
    if (topic && a.topic !== topic) return false;
    const text = `${a.title} ${a.summary} ${a.body.join(" ")}`.toLowerCase();
    return words.every((w) => text.includes(w));
  }).map(summary);
}

export const getArticle = (slug: string) => HELP_ARTICLES.find((a) => a.slug === slug) ?? null;
