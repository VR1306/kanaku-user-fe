"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/icons/icon";
import { TRANSITION } from "@/constants/motion";

type DrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Disables closing (Escape, backdrop, ×) while a save is in flight. */
  busy?: boolean;
  children: ReactNode;
};

/**
 * Right-hand slide-over panel on the native <dialog>: focus is trapped, Escape closes it and the
 * page behind is inert. Children are only mounted while open, so forms start fresh every time.
 */
export function Drawer({ open, title, onClose, busy, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !busy) onClose();
      }}
      className="drawer bg-surface text-ink"
    >
      {open ? (
        <motion.div
          className="drawer-panel"
          initial={{ x: 48, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={TRANSITION}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="font-display text-[28px] font-bold">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              disabled={busy}
              onClick={onClose}
              className="grid size-11 place-items-center rounded-[12px] bg-page text-link transition-colors hover:brightness-95"
            >
              <Icon name="close" size={18} strokeWidth={2.2} />
            </button>
          </div>
          {children}
        </motion.div>
      ) : null}
    </dialog>
  );
}
