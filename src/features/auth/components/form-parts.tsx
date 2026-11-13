"use client";

import { m as motion } from "framer-motion";

/** Top-of-form banner for form-level errors / success notices. */
export function FormNotice({ tone, children }: { tone: "error" | "success"; children: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
          : "rounded-control bg-success-tint px-4 py-3 text-sm text-success"
      }
    >
      {children}
    </motion.p>
  );
}
