import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { AUTH_TAGLINES } from "@/constants/auth";
import { RotatingLines } from "./rotating-lines";
import { Logo } from "@/components/ui/logo";

type BrandPanelProps = {
  eyebrow?: string;
  lines: [string, string];
  description?: string;
  footer: ReactNode;
};

/** Left navy panel shared by log in and create account. */
export function BrandPanel({ eyebrow, lines, description, footer }: BrandPanelProps) {
  return (
    <>
      <Logo tone="dark" size={40} />
      <div className="mt-auto mb-auto pt-16">
        {eyebrow ? (
          <p className="mb-6 text-[13px] tracking-[0.14em] text-accent-pale">{eyebrow}</p>
        ) : null}
        <h2 className="font-display text-5xl leading-[1.02] font-bold text-on-inverse xl:text-[60px]">
          {lines[0]}
          <br />
          <span className="text-accent">{lines[1]}</span>
        </h2>
        {description ? (
          <p className="mt-6 max-w-[420px] text-lg text-brand-pale">{description}</p>
        ) : null}
        <RotatingLines lines={AUTH_TAGLINES} />
      </div>
      {footer}
    </>
  );
}

export function QuoteCard({ quote, author }: { quote: string; author: string }) {
  const words = quote.split(" ").length;
  return (
    <figure className="max-w-[518px] rounded-panel border border-slate-700 p-6">
      <blockquote className="font-display text-xl text-slate-300 italic">
        <TextReveal text={`“${quote}”`} delay={0.5} />
      </blockquote>
      <Reveal delay={0.5 + words * 0.06 + 0.3} y={8}>
        <figcaption className="mt-4 text-sm text-slate-400">— {author}</figcaption>
      </Reveal>
    </figure>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-[18px]">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-4 text-base text-slate-300">
          <span className="grid size-6 place-items-center rounded-full bg-accent text-sm font-bold text-navy-950">
            ✓
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
