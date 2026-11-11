import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

/** White surface with subtle border, as used across the app and auth screens. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-line bg-surface p-[41px]", className)}
      {...rest}
    />
  );
}
