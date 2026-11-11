"use client";

import { motion, type Variants } from "framer-motion";
import { EASE_OUT } from "@/constants/motion";

type TextRevealProps = {
  text: string;
  /** Seconds before the first word starts. */
  delay?: number;
  /** Seconds between words. */
  stagger?: number;
  className?: string;
};

const container = (delay: number, stagger: number): Variants => ({
  hidden: {},
  show: { transition: { delayChildren: delay, staggerChildren: stagger } },
});

const word: Variants = {
  hidden: { y: "110%", opacity: 0 },
  show: { y: "0%", opacity: 1, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Reveals text word by word, each word rising out of a clipped line. */
export function TextReveal({ text, delay = 0, stagger = 0.06, className }: TextRevealProps) {
  return (
    <motion.span
      className={className}
      variants={container(delay, stagger)}
      initial="hidden"
      animate="show"
      aria-label={text}
    >
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom">
          <motion.span variants={word} className="inline-block">
            {w}
            {" "}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
