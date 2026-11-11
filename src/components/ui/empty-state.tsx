import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";

type EmptyStateProps = {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-card border border-line bg-surface px-6 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-[20px] bg-brand-tint text-link">
        <Icon name={icon} size={28} />
      </span>
      <h2 className="mt-6 font-display text-2xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-base text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
