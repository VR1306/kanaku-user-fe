"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Icon, type IconName } from "@/components/icons/icon";
import { SPRING } from "@/constants/motion";
import { cn } from "@/utils/cn";
import { Button } from "./button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  icon?: IconName;
  confirmLabel: string;
  cancelLabel?: string;
  /** "danger" = red confirm button (destructive or session-ending actions). */
  tone?: "primary" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Modal confirmation built on the native <dialog>: focus is trapped, Escape closes it,
 * and the page behind becomes inert. Clicking the dimmed backdrop cancels.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  icon = "help",
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  pending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      onCancel={(e) => {
        e.preventDefault(); // Escape: let the parent decide
        if (!pending) onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !pending) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[420px] rounded-card border border-line bg-surface p-0 text-ink backdrop:bg-navy-950/60 backdrop:backdrop-blur-sm"
    >
      {open ? (
        <motion.div
          className="p-7"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={SPRING}
        >
          <span
            className={cn(
              "grid size-12 place-items-center rounded-[14px]",
              tone === "danger" ? "bg-danger-tint text-danger" : "bg-brand-tint text-link",
            )}
          >
            <Icon name={icon} size={24} />
          </span>
          <h2 id="confirm-title" className="mt-5 font-display text-2xl font-bold">
            {title}
          </h2>
          <p id="confirm-desc" className="mt-2 text-[15px] text-muted">
            {description}
          </p>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onCancel} disabled={pending} autoFocus>
              {cancelLabel}
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              onClick={onConfirm}
              loading={pending}
            >
              {confirmLabel}
            </Button>
          </div>
        </motion.div>
      ) : null}
    </dialog>
  );
}
