import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

type SectionCardProps = {
  title: string;
  action?: { label: string; href: string };
  children: ReactNode;
  className?: string;
};

/** White card with a title row and an optional "View all →" style link. */
export function SectionCard({ title, action, children, className }: SectionCardProps) {
  return (
    <section className={cn("rounded-[24px] border border-line bg-surface p-[27px]", className)}>
      <header className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-[22px] leading-tight font-bold text-ink">{title}</h2>
        {action ? (
          <Link href={action.href} className="text-sm font-semibold text-accent-deep underline">
            {action.label} →
          </Link>
        ) : null}
      </header>
      {children}
    </section>
  );
}
