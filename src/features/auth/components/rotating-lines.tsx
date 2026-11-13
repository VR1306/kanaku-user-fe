"use client";

import { TAGLINE_INTERVAL_MS } from "@/constants/auth";
import { useEffect, useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { EASE_OUT } from "@/constants/motion";
import { cn } from "@/utils/cn";

type RotatingLinesProps = { lines: string[]; intervalMs?: number };

/** Cycles through short taglines with a slide/fade, plus progress dots. */
export function RotatingLines({ lines, intervalMs = TAGLINE_INTERVAL_MS }: RotatingLinesProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (lines.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % lines.length), intervalMs);
    return () => clearInterval(id);
  }, [lines.length, intervalMs]);

  return (
    <div className="mt-8">
      <div className="relative h-8 overflow-hidden" aria-live="off">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            className="font-display text-xl font-bold text-accent-pale"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            {lines[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex gap-2" aria-hidden="true">
        {lines.map((_, i) => (
          <motion.span
            key={i}
            className={cn("h-1.5 rounded-full", i === index ? "bg-accent" : "bg-ink-2")}
            animate={{ width: i === index ? 28 : 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        ))}
      </div>
    </div>
  );
}
