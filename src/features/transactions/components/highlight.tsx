import { Fragment } from "react";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wraps every occurrence of any search term in <mark>. Terms are plain text, never regex. */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const usable = terms.filter(Boolean);
  if (usable.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${usable.map(escape).join("|")})`, "gi");
  return (
    <>
      {text.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-accent-tint px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
