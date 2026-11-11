import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

/** Pulsing placeholder block for loading states. */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-control bg-line", className)}
      {...rest}
    />
  );
}
