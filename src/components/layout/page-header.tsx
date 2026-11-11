import type { ReactNode } from "react";

type PageHeaderProps = { title: string; description?: string; actions?: ReactNode };

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[32px] leading-tight font-bold text-ink sm:text-[40px]">
          {title}
        </h1>
        {description ? <p className="mt-2 text-base text-muted">{description}</p> : null}
      </div>
      {actions}
    </header>
  );
}
