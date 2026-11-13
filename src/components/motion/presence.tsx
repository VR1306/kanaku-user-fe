"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, animate, m as motion, useMotionValue, useTransform } from "framer-motion";
import { EASE_OUT } from "@/constants/motion";

const SWAP = { duration: 0.22, ease: EASE_OUT } as const;

/**
 * Cross-fades between views: when `id` changes, the old content fades out and the new content
 * slides in. Use it for tab content and for loading -> loaded swaps.
 */
export function FadeSwitch({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={id}
        className={className}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={SWAP}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Counts a number up to its value, formatted by `format`. */
export function CountUp({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (n) => format(n));
  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.7, ease: EASE_OUT });
    return () => controls.stop();
  }, [motionValue, value]);
  return <motion.span className={className}>{text}</motion.span>;
}
